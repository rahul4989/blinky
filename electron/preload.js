const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value)
  },
  overlay: {
    show: (opacity) => ipcRenderer.invoke('show-overlay', opacity),
    close: (reason) => ipcRenderer.invoke('close-overlay', reason),
    onClosed: (callback) => ipcRenderer.on('overlay-closed', callback),
    offClosed: (callback) => ipcRenderer.removeListener('overlay-closed', callback),
    onceClosed: (callback) => ipcRenderer.once('overlay-closed', callback)
  },
  closeOverlay: (reason) => ipcRenderer.invoke('close-overlay', reason),
  backgroundBlink: () => ipcRenderer.invoke('background-blink'),
  onTimerReset: (callback) => ipcRenderer.on('reset-timer', callback)
});
