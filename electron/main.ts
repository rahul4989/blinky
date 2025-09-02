import { app, BrowserWindow, ipcMain, screen } from 'electron';
import * as path from 'path';

// Force production mode when we want to use built files
const isDev = process.env.FORCE_PROD ? false : (process.env.NODE_ENV === 'development' || !app.isPackaged);

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let backgroundCameraWindow: BrowserWindow | null = null; // Hidden window for camera
let isOverlayVisible: boolean = false; // Track overlay state to prevent duplicates

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
      // webSecurity is enabled by default - no need to disable for camera access
    },
    titleBarStyle: 'default',
    resizable: true,
    show: false
  });

  // Load the React app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    
    // Force close all other windows when main window closes
    if (overlayWindow) {
      overlayWindow.close();
      overlayWindow = null;
    }
    if (backgroundCameraWindow) {
      backgroundCameraWindow.close();
      backgroundCameraWindow = null;
    }
    
    // Force quit the app
    app.quit();
  });

  // Create background camera window
  createBackgroundCameraWindow();
}

function createBackgroundCameraWindow(): void {
  backgroundCameraWindow = new BrowserWindow({
    width: 320,
    height: 240,
    show: false, // Hidden window
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the same React app but will show only camera
  const startUrl = isDev 
    ? 'http://localhost:3000?background=true' 
    : `file://${path.join(__dirname, '../../build/index.html')}?background=true`;
  
  backgroundCameraWindow.loadURL(startUrl);

  backgroundCameraWindow.on('closed', () => {
    backgroundCameraWindow = null;
  });

}

function createOverlayWindow(opacity: number = 0.6): void {
  // Prevent multiple overlays; clean up stale references if needed
  if (overlayWindow) {
    if (overlayWindow.isDestroyed()) {
      overlayWindow = null;
      isOverlayVisible = false;
    } else {
      return;
    }
  }
  if (isOverlayVisible) {
    return;
  }

  isOverlayVisible = true;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  overlayWindow = new BrowserWindow({
    width: primaryDisplay.bounds.width,
    height: primaryDisplay.bounds.height,
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreen: true,
    kiosk: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Create overlay HTML content with camera status and auto-dismiss
  const overlayHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          background-color: rgba(0, 0, 0, ${opacity});
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: white;
          text-align: center;
          cursor: pointer;
        }
        .content {
          animation: fadeIn 0.5s ease-in-out;
        }
        .eye {
          font-size: 6rem;
          animation: pulse 2s infinite;
        }
        .title {
          font-size: 3rem;
          font-weight: bold;
          margin: 1rem 0;
        }
        .subtitle {
          font-size: 1.5rem;
          margin: 0.5rem 0;
        }
        .status {
          font-size: 1.2rem;
          margin: 1rem 0;
          opacity: 0.8;
          color: #fbbf24;
        }
        .instruction {
          font-size: 1rem;
          opacity: 0.7;
          margin-top: 2rem;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </head>
    <body onclick="window.electronAPI?.closeOverlay?.('click')">
      <div class="content">
        <div class="eye">👁️</div>
        <div class="title">Time to Blink!</div>
        <div class="status">Starting camera for blink detection...</div>
        <div class="subtitle">Blink to dismiss this reminder</div>
        <div class="instruction">Or click anywhere to continue</div>
      </div>
      
      <script>
        const statusEl = document.querySelector('.status');
        
        // Update status after 1 second (camera ready)
        setTimeout(() => {
          statusEl.textContent = 'Camera ready - Blink now!';
          statusEl.style.color = '#10b981';
        }, 1000);
      </script>
    </body>
    </html>
  `;

  overlayWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(overlayHTML)}`);


  overlayWindow.on('closed', () => {
    overlayWindow = null;
    isOverlayVisible = false; // Reset state
  });

  // Handle escape key
  overlayWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      closeOverlayWindow('escape');
    }
  });
}

function closeOverlayWindow(reason: string = 'unknown'): void {
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  isOverlayVisible = false; // Ensure state is reset
  // Notify main window that overlay was closed with reason
  if (mainWindow) {
    mainWindow.webContents.send('overlay-closed', reason);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Force close all windows including hidden background camera
  if (backgroundCameraWindow) {
    backgroundCameraWindow.close();
    backgroundCameraWindow = null;
  }
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  
  // Standard quit behavior
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle app quit events (Cmd+Q on macOS, etc.)
app.on('before-quit', (event) => {
  
  // Force close all windows
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }
  if (overlayWindow) {
    overlayWindow.close();
    overlayWindow = null;
  }
  if (backgroundCameraWindow) {
    backgroundCameraWindow.close();
    backgroundCameraWindow = null;
  }
});

// Handle IPC messages for settings
ipcMain.handle('store-get', async (event, key: string) => {
  const Store = require('electron-store');
  const store = new Store();
  return store.get(key);
});

ipcMain.handle('store-set', async (event, key: string, value: any) => {
  const Store = require('electron-store');
  const store = new Store();
  store.set(key, value);
  return true;
});

// Handle overlay IPC messages
ipcMain.handle('show-overlay', async (event, opacity: number) => {
  const alreadyVisible = isOverlayVisible && overlayWindow && !overlayWindow.isDestroyed();
  if (!alreadyVisible) {
    createOverlayWindow(opacity);
    return { ok: true, alreadyVisible: false };
  }
  return { ok: true, alreadyVisible: true };
});

ipcMain.handle('close-overlay', async (event, reason: string = 'app-request') => {
  closeOverlayWindow(reason);
  return true;
});

// Handle background blink detection
ipcMain.handle('background-blink', async () => {
  // Always notify main window to reset timer on any blink
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('reset-timer');
  }
  
  if (isOverlayVisible) {
    closeOverlayWindow('blink');
  } else {
  }
  return true;
});

// Request camera permissions on macOS
if (process.platform === 'darwin') {
  app.whenReady().then(() => {
    const { systemPreferences } = require('electron');
    systemPreferences.askForMediaAccess('camera');
  });
}
