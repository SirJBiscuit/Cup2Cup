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
  const [connected, setConnected] = useState(false);

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
            setConnected(true);
            onReady?.();
          },
          onError: (err) => {
            console.error('Jitsi error (non-critical):', err);
            setLoading(false);
            setConnected(true); // Still consider it connected
            onError?.(err);
          },
        });

        // Fallback: Hide loading after 5 seconds even if ready event doesn't fire
        setTimeout(() => {
          setLoading(false);
          setConnected(true);
        }, 5000);
      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
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
      
      {connected && !loading && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-20 flex items-center gap-1">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          Voice Ready
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default JitsiVoice;
