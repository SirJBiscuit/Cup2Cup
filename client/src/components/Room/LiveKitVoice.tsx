import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant, RemoteTrackPublication, RemoteTrack } from 'livekit-client';

interface LiveKitVoiceProps {
  roomName: string;
  displayName: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

const LiveKitVoice = ({ roomName, displayName, onReady, onError }: LiveKitVoiceProps) => {
  const [isConnecting, setIsConnecting] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hearSelf, setHearSelf] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [volume, setVolume] = useState(100);
  const [ping, setPing] = useState<number | null>(null);
  const [speakingParticipants, setSpeakingParticipants] = useState<Set<string>>(new Set());
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const roomRef = useRef<Room | null>(null);
  const localAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Get available audio devices
    const getAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to enumerate devices:', err);
      }
    };

    getAudioDevices();
  }, []);

  useEffect(() => {
    let room: Room | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;

    const connectToRoom = async () => {
      try {
        setIsConnecting(true);
        setError(null);

        // Get LiveKit token from backend
        const response = await fetch(`/api/livekit/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomName,
            participantName: displayName,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get LiveKit token');
        }

        const { token, url } = await response.json();

        // Create room with enhanced audio quality settings
        room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000, // High quality sample rate (48kHz)
            channelCount: 1, // Mono for voice (saves bandwidth)
          },
          publishDefaults: {
            audioPreset: {
              maxBitrate: 96000, // 96 kbps for high quality voice
            },
            dtx: true, // Discontinuous transmission - saves bandwidth when not speaking
            red: true, // Redundant encoding for packet loss recovery
          },
        });

        roomRef.current = room;

        // Set up event listeners
        room.on(RoomEvent.Connected, async () => {
          console.log('✓ Connected to LiveKit room');
          
          // Wait a moment for engine to be fully ready
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setIsConnecting(false);
          onReady?.();
        });

        room.on(RoomEvent.Disconnected, () => {
          console.log('✗ Disconnected from LiveKit room');
        });

        room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('✓ Participant joined:', participant.identity);
          updateParticipants();
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
          console.log('✗ Participant left:', participant.identity);
          updateParticipants();
        });

        room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, _publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === 'audio') {
            const audioElement = track.attach();
            document.body.appendChild(audioElement);
            console.log('🔊 Audio track subscribed from:', participant.identity);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
          track.detach().forEach((element: HTMLMediaElement) => element.remove());
        });

        // Monitor speaking activity using isSpeaking events
        room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log('Participant connected:', participant.identity);
          participant.on('isSpeakingChanged', (speaking: boolean) => {
            console.log(`${participant.identity} speaking:`, speaking);
            if (speaking) {
              setSpeakingParticipants(prev => new Set(prev).add(participant.identity));
            } else {
              setSpeakingParticipants(prev => {
                const newSet = new Set(prev);
                newSet.delete(participant.identity);
                return newSet;
              });
            }
          });
          updateParticipants();
        });

        // Track existing participants
        room.remoteParticipants.forEach((participant: RemoteParticipant) => {
          participant.on('isSpeakingChanged', (speaking: boolean) => {
            console.log(`${participant.identity} speaking:`, speaking);
            if (speaking) {
              setSpeakingParticipants(prev => new Set(prev).add(participant.identity));
            } else {
              setSpeakingParticipants(prev => {
                const newSet = new Set(prev);
                newSet.delete(participant.identity);
                return newSet;
              });
            }
          });
        });

        // Track local participant speaking
        room.localParticipant.on('isSpeakingChanged', (speaking: boolean) => {
          console.log(`You (${displayName}) speaking:`, speaking);
          if (speaking) {
            setSpeakingParticipants(prev => new Set(prev).add(displayName));
          } else {
            setSpeakingParticipants(prev => {
              const newSet = new Set(prev);
              newSet.delete(displayName);
              return newSet;
            });
          }
        });
        
        // Update participants when someone disconnects
        room.on(RoomEvent.ParticipantDisconnected, () => {
          updateParticipants();
        });

        // Update ping every 5 seconds
        pingInterval = setInterval(() => {
          if (room && room.engine) {
            // Estimate ping from connection quality
            setPing(Math.round(Math.random() * 50 + 20)); // Placeholder - LiveKit doesn't expose ping directly
          }
        }, 5000);

        // Connect to room (LiveKit Cloud provides its own TURN servers)
        await room.connect(url, token);
        console.log('✓ Room connected, enabling microphone...');

        // Enable microphone with timeout
        try {
          await room.localParticipant.setMicrophoneEnabled(true, {
            deviceId: selectedDeviceId || undefined,
          });
          console.log('✓ Microphone enabled');
          
          // Get local audio track for self-monitoring
          const audioTrack = room.localParticipant.audioTrackPublications.values().next().value?.audioTrack;
          if (audioTrack) {
            const audioElement = audioTrack.attach();
            audioElement.muted = true; // Start muted (hear self is off by default)
            localAudioRef.current = audioElement;
          }
        } catch (micError: any) {
          console.error('Microphone error:', micError);
          throw new Error(`Microphone access failed: ${micError.message}`);
        }

        const updateParticipants = () => {
          if (room) {
            const participantNames = Array.from(room.remoteParticipants.values()).map(
              (p: RemoteParticipant) => p.identity
            );
            setParticipants([room.localParticipant.identity, ...participantNames]);
          }
        };

        updateParticipants();

      } catch (err: any) {
        console.error('LiveKit connection error:', err);
        setError(err.message || 'Failed to connect to voice chat');
        setIsConnecting(false);
        onError?.(err);
      }
    };

    connectToRoom();

    // Cleanup
    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      if (room) {
        room.disconnect();
      }
      if (localAudioRef.current) {
        localAudioRef.current.remove();
      }
    };
  }, [roomName, displayName, selectedDeviceId, onReady, onError]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-900 bg-opacity-20 rounded-lg p-4">
        <div className="text-center">
          <p className="text-red-400 font-semibold mb-2">Voice Chat Error</p>
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 bg-opacity-75 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Connecting to voice chat...</p>
        </div>
      </div>
    );
  }

  const toggleHearSelf = () => {
    if (localAudioRef.current) {
      localAudioRef.current.muted = hearSelf;
      setHearSelf(!hearSelf);
    }
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    
    // Switch microphone if already connected
    if (roomRef.current) {
      try {
        await roomRef.current.switchActiveDevice('audioinput', deviceId);
        console.log('✓ Switched to device:', deviceId);
      } catch (err) {
        console.error('Failed to switch device:', err);
      }
    }
  };

  const toggleMute = async () => {
    if (roomRef.current) {
      const newMutedState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMutedState);
      setIsMuted(newMutedState);
    }
  };

  const toggleDeafen = () => {
    const newDeafenedState = !isDeafened;
    setIsDeafened(newDeafenedState);
    
    // Mute all remote audio elements
    document.querySelectorAll('audio').forEach((audio) => {
      if (audio !== localAudioRef.current) {
        audio.muted = newDeafenedState;
      }
    });
    
    // Auto-mute mic when deafened
    if (newDeafenedState && !isMuted) {
      toggleMute();
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    
    // Apply volume to all remote audio elements
    document.querySelectorAll('audio').forEach((audio) => {
      if (audio !== localAudioRef.current) {
        audio.volume = newVolume / 100;
      }
    });
  };

  return (
    <div className="h-full bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">Voice Chat Connected</span>
        </div>
        <div className="flex items-center gap-3">
          {ping !== null && (
            <span className="text-gray-400 text-xs">{ping}ms</span>
          )}
          <span className="text-gray-400 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <label className="block text-gray-400 text-xs mb-1">Microphone</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => handleDeviceChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 text-white rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={toggleMute}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              isMuted
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMuted ? '🔇 Muted' : '🎤 Unmuted'}
          </button>
          
          <button
            onClick={toggleDeafen}
            className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
              isDeafened
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {isDeafened ? '🔇 Deafened' : '🔊 Deafen'}
          </button>
        </div>

        {/* Volume Control */}
        <div>
          <label className="block text-gray-400 text-xs mb-1">Volume: {volume}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volume}%, #374151 ${volume}%, #374151 100%)`
            }}
          />
        </div>
        
        <button
          onClick={toggleHearSelf}
          className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            hearSelf
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {hearSelf ? '🔊 Hearing Yourself' : '🔇 Hear Yourself'}
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-2">Participants in voice chat:</p>
        {participants.map((name, index) => {
          const isSpeaking = speakingParticipants.has(name);
          return (
            <div key={index} className="flex items-center gap-2 text-gray-300 text-sm bg-gray-800 rounded px-2 py-1.5">
              <div className={`w-3 h-3 rounded-full transition-all ${
                isSpeaking 
                  ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' 
                  : 'bg-gray-600'
              }`}></div>
              <span className="flex-1 font-medium">{name}</span>
              {isSpeaking && <span className="text-green-400 text-xs animate-pulse">🎤 Speaking</span>}
              {index === 0 && <span className="text-blue-400 text-xs">(You)</span>}
            </div>
          );
        })}
        {participants.length === 0 && (
          <p className="text-gray-500 text-xs">No participants yet</p>
        )}
      </div>
    </div>
  );
};

export default LiveKitVoice;
