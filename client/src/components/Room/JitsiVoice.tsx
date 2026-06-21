import { useEffect, useState } from 'react';

interface JitsiVoiceProps {
  roomName: string;
  displayName: string;
  onReady?: () => void;
  onError?: (error: any) => void;
}

const JitsiVoice = ({ roomName, displayName, onReady }: JitsiVoiceProps) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide loading after iframe loads
    const timer = setTimeout(() => {
      setLoading(false);
      onReady?.();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onReady]);

  // Build Jitsi URL with custom server - prejoin is disabled on our server!
  const jitsiUrl = `https://jitsi.cup2cup.xyz/${encodeURIComponent(roomName)}#config.startWithAudioMuted=false&config.startWithVideoMuted=true&userInfo.displayName="${encodeURIComponent(displayName)}"`;

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Loading voice chat...</p>
            <p className="text-gray-400 text-sm mt-2">Click "Join meeting" when ready</p>
          </div>
        </div>
      )}
      
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full h-full border-0"
        onLoad={() => {
          setLoading(false);
          onReady?.();
        }}
      />
    </div>
  );
};

export default JitsiVoice;
