import React, { useState, useEffect } from 'react';

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
      };
      overlay: {
        show: (opacity: number) => Promise<{ ok: boolean; alreadyVisible?: boolean } | boolean>;
        close: (reason?: string) => Promise<boolean>;
        onClosed: (callback: (event: any, reason?: string) => void) => void;
        offClosed?: (callback: (event: any, reason?: string) => void) => void;
        onceClosed?: (callback: (event: any, reason?: string) => void) => void;
      };
      backgroundBlink?: () => Promise<boolean>;
      onTimerReset?: (callback: () => void) => void;
    };
  }
}

interface SettingsData {
  enabled: boolean;
  timerInterval: number; // seconds
  overlayOpacity: number; // 0-1
  earThreshold: number;
  minBlinkFrames: number;
}

interface SettingsProps {
  onSettingsChange?: (settings: SettingsData) => void;
  className?: string;
}

const defaultSettings: SettingsData = {
  enabled: true,
  timerInterval: 5, // Changed default to 5 seconds
  overlayOpacity: 0.6,
  earThreshold: 0.22,
  minBlinkFrames: 2
};

const Settings: React.FC<SettingsProps> = ({ 
  onSettingsChange,
  className = ''
}) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from electron-store
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (window.electronAPI) {
          const stored = await window.electronAPI.store.get('settings');
          if (stored) {
            setSettings({ ...defaultSettings, ...stored });
          }
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to electron-store
  const saveSettings = async (newSettings: SettingsData) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.store.set('settings', newSettings);
      }
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
    } catch (error) {
    }
  };

  const updateSetting = (key: keyof SettingsData, value: any) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={`p-4 space-y-6 ${className}`}>
      <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
      
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => updateSetting('enabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Enable Blink Reminders
          </span>
        </label>
      </div>

      {/* Timer Interval */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Timer Interval: {settings.timerInterval} seconds
        </label>
        <input
          type="range"
          min="5"
          max="120"
          step="5"
          value={settings.timerInterval}
          onChange={(e) => updateSetting('timerInterval', parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>5s</span>
          <span>120s</span>
        </div>
      </div>

      {/* Overlay Opacity */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Overlay Opacity: {Math.round(settings.overlayOpacity * 100)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={settings.overlayOpacity}
          onChange={(e) => updateSetting('overlayOpacity', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>10%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Advanced Settings */}
      <details className="border-t pt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-4">
          Advanced Settings
        </summary>
        
        <div className="space-y-4">
          {/* EAR Threshold */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              EAR Threshold: {settings.earThreshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.15"
              max="0.35"
              step="0.01"
              value={settings.earThreshold}
              onChange={(e) => updateSetting('earThreshold', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500">
              Lower values = more sensitive blink detection
            </div>
          </div>

          {/* Min Blink Frames */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Min Blink Frames: {settings.minBlinkFrames}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.minBlinkFrames}
              onChange={(e) => updateSetting('minBlinkFrames', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500">
              Consecutive frames below threshold to register a blink
            </div>
          </div>
        </div>
      </details>

      {/* Reset to Defaults */}
      <div className="border-t pt-4">
        <button
          onClick={() => saveSettings(defaultSettings)}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default Settings;
export type { SettingsData };
