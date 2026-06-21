import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import socketService from '../../services/socket';
import soundService from '../../services/sounds';
import JitsiVoice from './JitsiVoice';
import type { Participant, ChatMessage } from '../../types';

const VoiceRoom = () => {
  const { phraseCode } = useParams<{ phraseCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [jitsiReady, setJitsiReady] = useState(false);
  const [micError, setMicError] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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
      soundService.play('join');
      
      // Voice chat is now handled by Jitsi component
      setVoiceEnabled(true);
    });

    socketService.onRoomParticipants((data) => {
      const oldCount = participants.length;
      const newCount = data.participants.length;
      
      if (newCount > oldCount) {
        soundService.play('join');
      } else if (newCount < oldCount) {
        soundService.play('leave');
      }
      
      setParticipants(data.participants);
    });

    socketService.onChatMessage((message) => {
      setChatMessages((prev: ChatMessage[]) => [...prev, message]);
      soundService.play('message');
    });

    socketService.onError((error) => {
      alert(error.message);
      navigate('/');
    });

    return () => {
      socket.emit('leave-room', { phraseCode });
      socketService.disconnect();
    };
  }, [phraseCode, searchParams, navigate]);

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (chatInput.trim()) {
      socketService.sendChatMessage(phraseCode!, chatInput);
      setChatInput('');
    }
  };

  const handleLeaveRoom = () => {
    const token = localStorage.getItem('accessToken');
    navigate(token ? '/dashboard' : '/');
  };

  const handleCopyRoomCode = () => {
    if (phraseCode) {
      navigator.clipboard.writeText(phraseCode);
      alert('Room code copied to clipboard!');
    }
  };

  const handleShareRoom = () => {
    if (phraseCode) {
      const shareUrl = `${window.location.origin}/room/${phraseCode}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Room link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Room: {phraseCode}</h1>
            <button
              onClick={handleCopyRoomCode}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
              title="Copy room code"
            >
              📋 Copy Code
            </button>
            <button
              onClick={handleShareRoom}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
              title="Copy shareable link"
            >
              🔗 Share Link
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {connected ? `${participants.length} participant${participants.length !== 1 ? 's' : ''}` : 'Connecting...'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Leave Room
          </button>
        </div>
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
                  <div className="flex gap-2 items-center">
                    {participant.isMuted && (
                      <span className="text-red-400 text-sm flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                        Muted
                      </span>
                    )}
                    {participant.isSpeaking && !participant.isMuted && (
                      <span className="text-green-400 text-sm flex items-center gap-1 animate-pulse">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
                        <span className="w-2 h-2 bg-green-400 rounded-full absolute"></span>
                        Speaking
                      </span>
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
              <h3 className="text-lg font-semibold mb-3">🎤 Voice Chat</h3>
              
              {micError && (
                <div className="mb-3 bg-red-900/20 border border-red-800 text-red-400 px-4 py-2 rounded-lg text-sm">
                  {micError}
                </div>
              )}
              
              {voiceEnabled && connected && phraseCode && (
                <div className="space-y-3">
                  {/* Connection Status - Only show when Jitsi is ready */}
                  {jitsiReady && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-700 rounded-lg">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span className="text-green-400 text-sm font-medium">Voice Chat Connected</span>
                    </div>
                  )}

                  {/* Voice Controls */}
                  {jitsiReady && (
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          const audio = new Audio();
                          navigator.mediaDevices.getUserMedia({ audio: true })
                            .then(stream => {
                              const audioContext = new AudioContext();
                              const source = audioContext.createMediaStreamSource(stream);
                              const destination = audioContext.createMediaStreamDestination();
                              source.connect(destination);
                              audio.srcObject = destination.stream;
                              audio.play();
                              setTimeout(() => {
                                audio.pause();
                                stream.getTracks().forEach(track => track.stop());
                              }, 3000);
                            });
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        🎧 Test Audio (3s)
                      </button>
                    </div>
                  )}

                  {/* Jitsi Voice Chat - Taller iframe to show controls */}
                  <div className="h-96 bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
                    <JitsiVoice
                      roomName={`cup2cup-${phraseCode}`}
                      displayName={searchParams.get('name') ? decodeURIComponent(searchParams.get('name')!) : 'User'}
                      onReady={() => {
                        console.log('Jitsi voice chat ready');
                        setJitsiReady(true);
                        setMicError('');
                      }}
                    />
                  </div>
                </div>
              )}
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
