import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import socketService from '../../services/socket';
import webrtcService from '../../services/webrtc';
import type { Participant, ChatMessage } from '../../types';

const VoiceRoom = () => {
  const { phraseCode } = useParams<{ phraseCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [connected, setConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [micError, setMicError] = useState('');

  useEffect(() => {
    const isGuest = searchParams.get('guest') === 'true';
    const guestName = searchParams.get('name');

    const socket = socketService.connect();
    
    socket.emit('join-room', {
      phraseCode,
      displayName: isGuest && guestName ? decodeURIComponent(guestName) : 'User',
    });

    socketService.onJoinedRoom(async (data) => {
      setConnected(true);
      setParticipants(data.participants);
      
      // Initialize WebRTC after joining room
      try {
        await webrtcService.initialize();
        setVoiceEnabled(true);
        
        // Create offers to existing participants
        data.participants.forEach((participant) => {
          if (participant.socketId !== socket.id) {
            webrtcService.createOffer(participant.socketId);
          }
        });
      } catch (error: any) {
        setMicError(error.message || 'Failed to access microphone');
        console.error('Microphone error:', error);
      }
    });

    socketService.onRoomParticipants((data) => {
      const oldParticipants = participants;
      setParticipants(data.participants);
      
      // Handle new participants
      data.participants.forEach((participant) => {
        const isNew = !oldParticipants.find(p => p.socketId === participant.socketId);
        if (isNew && participant.socketId !== socket.id && voiceEnabled) {
          webrtcService.createOffer(participant.socketId);
        }
      });
      
      // Handle removed participants
      oldParticipants.forEach((oldParticipant) => {
        const stillPresent = data.participants.find(p => p.socketId === oldParticipant.socketId);
        if (!stillPresent) {
          webrtcService.removePeer(oldParticipant.socketId);
        }
      });
    });

    socketService.onChatMessage((message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    // WebRTC signaling handlers
    socketService.onOffer(({ offer, fromSocketId }) => {
      webrtcService.handleOffer(fromSocketId, offer);
    });

    socketService.onAnswer(({ answer, fromSocketId }) => {
      webrtcService.handleAnswer(fromSocketId, answer);
    });

    socketService.onICECandidate(({ candidate, fromSocketId }) => {
      webrtcService.handleIceCandidate(fromSocketId, candidate);
    });

    socketService.onError((error) => {
      alert(error.message);
      navigate('/');
    });

    return () => {
      socket.emit('leave-room', { phraseCode });
      webrtcService.disconnect();
      socketService.disconnect();
    };
  }, [phraseCode, searchParams, navigate, participants, voiceEnabled]);

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socketService.sendChatMessage(phraseCode!, chatInput);
      setChatInput('');
    }
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      webrtcService.unmute();
    } else {
      webrtcService.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleDeafenToggle = () => {
    if (isDeafened) {
      webrtcService.undeafen();
    } else {
      webrtcService.deafen();
    }
    setIsDeafened(!isDeafened);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Room: {phraseCode}</h1>
          <p className="text-sm text-gray-400">
            {connected ? `${participants.length} participant${participants.length !== 1 ? 's' : ''}` : 'Connecting...'}
          </p>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          Leave Room
        </button>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        <div className="flex-1 p-6">
          <div className="bg-gray-800 rounded-lg p-6 h-full">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.socketId}
                  className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                      {participant.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{participant.displayName}</p>
                      <p className="text-xs text-gray-400">
                        {participant.userId ? 'Account' : 'Guest'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {participant.isMuted && (
                      <span className="text-red-400 text-sm">🔇 Muted</span>
                    )}
                    {participant.isSpeaking && (
                      <span className="text-green-400 text-sm">🎤 Speaking</span>
                    )}
                  </div>
                </div>
              ))}
              {participants.length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  Waiting for participants...
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-3">Audio Controls</h3>
              
              {micError && (
                <div className="mb-3 bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {micError}
                </div>
              )}
              
              {voiceEnabled && (
                <div className="mb-3 bg-green-900/20 border border-green-800 text-green-400 px-4 py-2 rounded-lg text-sm">
                  🎤 Voice chat active
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleMuteToggle}
                  disabled={!voiceEnabled}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    isMuted
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isMuted ? '🔇 Unmute' : '🎤 Mute'}
                </button>
                <button
                  onClick={handleDeafenToggle}
                  disabled={!voiceEnabled}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    isDeafened
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isDeafened ? '🔇 Undeafen' : '🔊 Deafen'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Chat</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-3">
                <p className="font-medium text-sm text-blue-400">{msg.displayName}</p>
                <p className="text-sm mt-1">{msg.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))}
            {chatMessages.length === 0 && (
              <p className="text-gray-400 text-center py-8">No messages yet</p>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VoiceRoom;
