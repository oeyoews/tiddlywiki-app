const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openWiki: () => ipcRenderer.invoke('dialog:openWiki'),
  buildWiki: () => ipcRenderer.invoke('wiki:build'),
  openInBrowser: () => ipcRenderer.invoke('wiki:openInBrowser'),
  getWikiInfo: () => ipcRenderer.invoke('wiki:getInfo'),
});