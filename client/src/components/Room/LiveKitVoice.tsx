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
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    let room: Room | null = null;

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

        // Create room
        room = new Room({
          adaptiveStream: true,
          dynacast: true,
          audioCaptureDefaults: {
            autoGainControl: true,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        roomRef.current = room;

        // Set up event listeners
        room.on(RoomEvent.Connected, () => {
          console.log('✓ Connected to LiveKit room');
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

        // Connect to room (LiveKit Cloud provides its own TURN servers)
        await room.connect(url, token);

        // Enable microphone
        await room.localParticipant.setMicrophoneEnabled(true);

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
      if (room) {
        room.disconnect();
      }
    };
  }, [roomName, displayName, onReady, onError]);

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

  return (
    <div className="h-full bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">Voice Chat Connected</span>
        </div>
        <span className="text-gray-400 text-sm">{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="space-y-2">
        {participants.map((name, index) => (
          <div key={index} className="flex items-center gap-2 text-gray-300 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{name}</span>
            {index === 0 && <span className="text-gray-500">(You)</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveKitVoice;
