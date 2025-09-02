import React, { useState, useEffect, useCallback } from 'react';
import CameraFeed from './components/CameraFeed';
import Settings, { SettingsData } from './components/Settings';

const App: React.FC = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    enabled: true,
    timerInterval: 5,
    overlayOpacity: 0.6,
    earThreshold: 0.22,
    minBlinkFrames: 2
  });
  const [timeLeft, setTimeLeft] = useState(settings.timerInterval);
  const [cameraActive, setCameraActive] = useState(false);

  // Check if running in background mode
  const isBackgroundMode = new URLSearchParams(window.location.search).get('background') === 'true';

  // Background mode - only show camera for blink detection
  if (isBackgroundMode) {
    return (
      <div className="w-full h-full bg-black">
        <CameraFeed
          onBlink={async () => {
            if (window.electronAPI?.backgroundBlink) {
              await window.electronAPI.backgroundBlink();
            }
          }}
          enabled={true}
          className="w-full h-full"
        />
      </div>
    );
  }

  // Show fullscreen overlay
  const showFullscreenOverlay = useCallback(async () => {
    if (window.electronAPI?.overlay && !showOverlay) {
      try {
        const res = await window.electronAPI.overlay.show(settings.overlayOpacity);
        // Reflect overlay visibility locally regardless of prior state
        setShowOverlay(true);
      } catch (error) {
      }
    }
  }, [settings.overlayOpacity, showOverlay]);

  // Close fullscreen overlay
  const closeFullscreenOverlay = useCallback(async (reason: string = 'app-request') => {
    if (window.electronAPI?.overlay) {
      try {
        await window.electronAPI.overlay.close(reason);
        setShowOverlay(false);
        setTimeLeft(settings.timerInterval);
      } catch (error) {
      }
    }
  }, [settings.timerInterval]);

  // Listen for overlay close events from Electron with cleanup
  useEffect(() => {
    if (!window.electronAPI?.overlay) return;
    const handler = (_event: any, _reason?: string) => {
      setShowOverlay(false);
      setTimeLeft(settings.timerInterval);
    };
    window.electronAPI.overlay.onClosed(handler);
    return () => {
      window.electronAPI.overlay.offClosed?.(handler);
    };
  }, [settings.timerInterval]);

  // Listen for timer reset events from background blinks
  useEffect(() => {
    if (window.electronAPI?.onTimerReset) {
      window.electronAPI.onTimerReset(() => {
        setTimeLeft(settings.timerInterval);
      });
    }
  }, [settings.timerInterval]);

  // Timer for blink reminder - shows overlay only if no blinks detected in x seconds
  useEffect(() => {
    if (!settings.enabled) {
      setTimeLeft(settings.timerInterval);
      return;
    }

    setTimeLeft(settings.timerInterval); // Always start with full interval

    const timer = setInterval(() => {
      setTimeLeft((prev: number) => {
        if (prev <= 1) {
          showFullscreenOverlay();
          return settings.timerInterval; // Reset to full interval
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [settings.enabled, settings.timerInterval, showFullscreenOverlay]); // Restart when interval changes

  // Handle blink detection - reset timer on every blink
  const handleBlink = useCallback(async () => {
    if (settings.enabled) {
      // Reset the countdown timer whenever user blinks
      setTimeLeft(settings.timerInterval);
      
      try {
        await closeFullscreenOverlay('blink');
      } catch (error) {
      }
    }
  }, [settings.enabled, settings.timerInterval, closeFullscreenOverlay]);

  // Handle settings change
  const handleSettingsChange = useCallback((newSettings: SettingsData) => {
    setSettings(newSettings);
    setCameraActive(newSettings.enabled);
    if (!newSettings.enabled && showOverlay) {
      closeFullscreenOverlay('settings-disabled');
    }
  }, [showOverlay, closeFullscreenOverlay]);

  // Initialize camera state
  useEffect(() => {
    setCameraActive(settings.enabled);
  }, [settings.enabled]);

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Blinky</h1>
            <p className="text-sm text-gray-600">
              AI-powered blink reminders for better eye health
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Timer Display */}
            <div className="text-center">
              <div className={`text-2xl font-mono ${
                timeLeft <= 5 ? 'text-red-500' : 'text-gray-700'
              }`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">
                {settings.enabled ? 'Next reminder' : 'Disabled'}
              </div>
            </div>
            
            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ⚙️
            </button>
          </div>
        </header>

        {/* Main Area */}
        <div className="flex-1 flex">
          {/* Camera Feed */}
          <div className="flex-1 p-4">
            <div className="h-full bg-white rounded-lg shadow-sm overflow-hidden">
              {cameraActive ? (
                <CameraFeed
                  onBlink={handleBlink}
                  enabled={cameraActive}
                  className="h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500 p-8">
                    <div className="text-6xl mb-4">📷</div>
                    <h3 className="text-xl font-semibold mb-2">Camera Disabled</h3>
                    <p className="text-sm opacity-75">
                      Enable blink detection in settings to activate camera
                    </p>
                    <div className="mt-4 text-xs opacity-50">
                      Camera runs continuously when enabled for instant blink detection
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="w-80 bg-white border-l shadow-lg">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <Settings 
                onSettingsChange={handleSettingsChange}
                className="overflow-y-auto"
              />
            </div>
          )}
        </div>

        {/* Status Bar */}
        <footer className="bg-white border-t px-4 py-2 text-sm text-gray-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className={`flex items-center space-x-1 ${
                settings.enabled ? 'text-green-600' : 'text-gray-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  settings.enabled ? 'bg-green-500' : 'bg-gray-400'
                }`}></span>
                <span>{settings.enabled ? 'Active' : 'Disabled'}</span>
              </span>
              <span>Interval: {settings.timerInterval}s</span>
              <span>Opacity: {Math.round(settings.overlayOpacity * 100)}%</span>
              <span className={`flex items-center space-x-1 ${
                cameraActive ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  cameraActive ? 'bg-blue-500' : 'bg-gray-400'
                }`}></span>
                <span>Camera: {cameraActive ? 'Active' : 'Standby'}</span>
              </span>
            </div>
            <div className="text-xs">
              Blink anytime to dismiss overlay • Camera runs continuously when enabled
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
