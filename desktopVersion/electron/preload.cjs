const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pomodoroDesktop', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setWallpaper: filePayload => ipcRenderer.invoke('settings:setWallpaper', filePayload),
  setSound: filePayload => ipcRenderer.invoke('settings:setSound', filePayload),
  resetWallpaper: () => ipcRenderer.invoke('settings:resetWallpaper'),
  resetSound: () => ipcRenderer.invoke('settings:resetSound'),
  updateTrayTimer: state => ipcRenderer.send('tray:updateTimer', state),
  hideWindow: () => ipcRenderer.send('window:hide'),
  onTrayCommand: callback => {
    const listener = (_event, command) => callback(command);
    ipcRenderer.on('tray:command', listener);
    return () => ipcRenderer.removeListener('tray:command', listener);
  },
  onPopupView: callback => {
    const listener = (_event, view) => callback(view);
    ipcRenderer.on('popup:view', listener);
    return () => ipcRenderer.removeListener('popup:view', listener);
  }
});
