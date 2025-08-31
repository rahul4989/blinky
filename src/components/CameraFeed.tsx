import React from 'react';
import { useBlinkDetector } from '../hooks/useBlinkDetector';

interface CameraFeedProps {
  onBlink?: () => void;
  enabled?: boolean;
  className?: string;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  onBlink,
  enabled = true,
  className = ''
}) => {
  const { videoRef, state } = useBlinkDetector({
    onBlink,
    enabled
  });

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover rounded-lg"
        autoPlay
        muted
        playsInline
      />
      
      {/* Status Overlay */}
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
        {state.error ? (
          <span className="text-red-400">❌ {state.error}</span>
        ) : !state.isInitialized ? (
          <span className="text-yellow-400">🔄 Initializing...</span>
        ) : !state.isDetecting ? (
          <span className="text-yellow-400">📷 Starting camera...</span>
        ) : (
          <span className="text-green-400">✅ Detecting</span>
        )}
      </div>

      {/* EAR Values Display (for debugging) */}
      {state.isDetecting && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          <div>L: {state.leftEAR.toFixed(3)}</div>
          <div>R: {state.rightEAR.toFixed(3)}</div>
        </div>
      )}

      {/* Permission Message */}
      {state.error && state.error.includes('camera') && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 rounded-lg">
          <div className="text-center text-white p-4">
            <div className="text-4xl mb-4">📷</div>
            <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
            <p className="text-sm opacity-75">
              Please allow camera access to enable blink detection.
            </p>
            <p className="text-xs opacity-50 mt-2">
              Refresh the app after granting permission.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
