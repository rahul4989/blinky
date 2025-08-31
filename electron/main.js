const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // Required for camera access
    },
    titleBarStyle: 'default',
    resizable: true,
    show: false
  });

  // Load the React app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle IPC messages for settings
ipcMain.handle('store-get', (event, key) => {
  const Store = require('electron-store');
  const store = new Store();
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  const Store = require('electron-store');
  const store = new Store();
  store.set(key, value);
  return true;
});

// Request camera permissions on macOS
if (process.platform === 'darwin') {
  app.whenReady().then(() => {
    const { systemPreferences } = require('electron');
    systemPreferences.askForMediaAccess('camera');
  });
}
