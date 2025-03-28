const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  alert: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'alert', message }),
  confirm: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'confirm', message }),
  onConfigGithub: (callback) => ipcRenderer.on('config-github', callback),
  // onShowWikiInfo: (callback) => ipcRenderer.on('show-wiki-info', callback),
  sendGHConfig: (data) => ipcRenderer.invoke('update-gh-config', data),
  // 双向
  onTidInfo: (callback) =>
    ipcRenderer.on('update-tid', (_event, value) => callback(value)),
  sendTidInfo: (value) => ipcRenderer.send('tid-info', value),

  // onTwInstanceUpdate: (callback) =>
  //   ipcRenderer.on('tw-instance-update', callback),
  // openWiki: () => ipcRenderer.invoke('dialog:openWiki'),
  // buildWiki: () => ipcRenderer.invoke('wiki:build'),
  // openInBrowser: () => ipcRenderer.invoke('wiki:openInBrowser'),
  // getWikiInfo: () => ipcRenderer.invoke('wiki:getInfo'),
});
