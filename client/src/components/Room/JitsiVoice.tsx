import { useEffect, useRef, useState } from 'react';
import jitsiService from '../../services/jitsi';

interface JitsiVoiceProps {
  roomName: string;
  displayName: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

const JitsiVoice = ({ roomName, displayName, onReady, onError }: JitsiVoiceProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initJitsi = async () => {
      if (!containerRef.current) return;

      try {
        await jitsiService.connect({
          roomName,
          displayName,
          parentNode: containerRef.current,
          onReady: () => {
            setLoading(false);
            onReady?.();
          },
          onError: (err) => {
            setError('Voice chat connection failed');
            setLoading(false);
            onError?.(err);
          },
        });
      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
        setError('Failed to load voice chat');
        setLoading(false);
        onError?.(err);
      }
    };

    initJitsi();

    return () => {
      jitsiService.disconnect();
    };
  }, [roomName, displayName, onReady, onError]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Connecting to voice chat...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-20">
          {error}
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default JitsiVoice;
