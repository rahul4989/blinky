import React from 'react';

interface OverlayProps {
  isVisible: boolean;
  opacity?: number;
  onClose?: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ 
  isVisible, 
  opacity = 0.6,
  onClose 
}) => {
  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 bg-black transition-opacity duration-500 ease-in-out
        ${isVisible ? 'animate-fade-in' : 'animate-fade-out'}
      `}
      style={{ opacity }}
      onClick={onClose}
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-white text-center space-y-4">
          <div className="text-6xl animate-pulse">👁️</div>
          <h2 className="text-3xl font-bold">Time to Blink!</h2>
          <p className="text-xl">
            Blink to dismiss this reminder
          </p>
          <div className="text-sm opacity-75 mt-8">
            Click anywhere or blink to continue
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overlay;
