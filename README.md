# Blinky 👁️

A cross-platform desktop application that reminds users to blink by monitoring eye blink patterns using MediaPipe FaceMesh and computer vision.

![Blink Trainer Demo](demo.png)

## Features

- **Real-time Blink Detection**: Uses MediaPipe FaceMesh to detect eye blinks through your webcam
- **Customizable Reminders**: Set timer intervals from 5 to 120 seconds
- **Smart Overlay**: Fullscreen fade overlay that appears when you haven't blinked
- **Instant Dismissal**: Overlay disappears immediately when a blink is detected
- **Persistent Settings**: All preferences are saved using electron-store
- **Cross-Platform**: Works on macOS, Windows, and Linux

## Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Desktop**: Electron
- **Computer Vision**: MediaPipe FaceMesh
- **Settings Storage**: Electron Store

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Webcam access

### Clone and Install
```bash
git clone https://github.com/rahul4989/blinky.git
cd blinky
npm install
```

### Development
```bash
# Start both React dev server and Electron
npm start

# Or start them separately:
npm run react:start    # React dev server on localhost:3000
npm run electron:start # Electron app
```

### Building for Production
```bash
# Build React app
npm run react:build

# Build Electron main process
npm run electron:build

# Package for distribution
npm run dist           # All platforms
npm run dist:mac        # macOS only
npm run dist:win        # Windows only
npm run dist:linux      # Linux only
```

## How It Works

### Blink Detection Algorithm
1. **Face Detection**: MediaPipe FaceMesh detects facial landmarks in real-time
2. **Eye Aspect Ratio (EAR)**: Calculates the ratio of eye height to width for both eyes
3. **Blink Recognition**: When EAR drops below threshold (default 0.22) for 2+ consecutive frames
4. **Timer Reset**: Each detected blink resets the reminder timer

### App Behavior
1. Timer counts down from configured interval (default 20 seconds)
2. If no blink detected when timer reaches zero → **fullscreen overlay covers entire screen** (all monitors)
3. As soon as blink detected → instantly remove overlay and reset timer to **current interval setting**
4. When settings are changed → timer immediately resets to **new interval value**
5. Process repeats continuously while app is running

### Fullscreen Overlay System
- **True Fullscreen**: Overlay covers the entire screen(s), not just the app window
- **Multi-Monitor Support**: Works across all connected displays
- **Always On Top**: Overlay appears above all other applications
- **Multiple Dismissal Methods**: Click anywhere, press Esc, or blink to dismiss
- **Smooth Animations**: Fade in/out transitions for better UX

## Settings

### Basic Settings
- **Enable/Disable**: Toggle blink reminders on/off
- **Timer Interval**: 5-120 seconds between reminders
- **Overlay Opacity**: 10-100% darkness level

### Advanced Settings
- **EAR Threshold**: 0.15-0.35 (lower = more sensitive detection)
- **Min Blink Frames**: 1-5 consecutive frames required for blink detection

## Keyboard Shortcuts

- **Esc**: Dismiss overlay (same as clicking or blinking)
- **⚙️ Button**: Toggle settings panel

## Camera Permissions

The app uses your device's camera through standard web APIs - **no special Chrome access required**.

### macOS
- Grant camera permissions when prompted
- If denied, go to System Preferences → Security & Privacy → Camera → Enable for your app

### Windows
- Allow camera access in Windows Settings → Privacy & Security → Camera

### Linux
- Ensure camera device has proper permissions: `sudo usermod -a -G video $USER`
- Restart after adding to video group

## Troubleshooting

### Camera Not Working
1. Check browser/app has camera permissions
2. Ensure no other apps are using the camera
3. Try refreshing the app
4. Check DevTools console for error messages

### Blink Detection Too Sensitive/Insensitive
- Adjust **EAR Threshold** in advanced settings
- Lower values = more sensitive (detects smaller eye movements)
- Higher values = less sensitive (requires more pronounced blinks)

### Timer Not Resetting Properly
1. Check that you're using the latest version with persistent interval settings
2. When you change the timer interval, it should immediately reset to the new value
3. All future timer cycles use the updated interval setting
4. Blinks during normal operation reset timer to current interval setting

## Development Notes

### Project Structure
```
blink-trainer-app/
├── electron/           # Electron main process
│   ├── main.ts         # Main process (TypeScript)
│   ├── main.js         # Main process (JavaScript)
│   └── preload.js      # Preload script for IPC
├── src/
│   ├── components/     # React components
│   │   ├── CameraFeed.tsx
│   │   ├── Overlay.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   └── useBlinkDetector.ts
│   ├── utils/
│   │   └── blinkLogic.ts
│   ├── App.tsx
│   └── index.tsx
├── public/
└── dist/              # Built files
```

### MediaPipe Integration
- Uses CDN version of MediaPipe for face detection
- FaceMesh model provides 468 facial landmarks
- Eye landmarks are extracted for EAR calculation
- Runs at camera framerate (typically 30 FPS)

### Electron Security
- Context isolation enabled
- Node integration disabled
- Secure IPC communication via preload script
- Settings stored in OS-appropriate locations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use and modify as needed.

## Author

**Rahul Kalra**
- Website: [rahulkalra.me](https://rahulkalra.me)
- GitHub: [@rahul4989](https://github.com/rahul4989)

## Health Disclaimer

This app is intended as a reminder tool and should not replace professional medical advice. If you experience persistent eye strain, dry eyes, or vision problems, consult an eye care professional.
