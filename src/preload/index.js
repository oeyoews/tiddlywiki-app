const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendTiddlyWikiInstance: (twInstance) => {
    // console.log(twInstance, 'saveed instance');
    ipcRenderer.invoke('send-tw-instance', twInstance);
  },
  alert: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'alert', message }),
  confirm: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'confirm', message }),
  onConfigGithub: (callback) => ipcRenderer.on('config-github', callback),
  onShowWikiInfo: (callback) => ipcRenderer.on('show-wiki-info', callback),

  // onTwInstanceUpdate: (callback) =>
  //   ipcRenderer.on('tw-instance-update', callback),
  // openWiki: () => ipcRenderer.invoke('dialog:openWiki'),
  // buildWiki: () => ipcRenderer.invoke('wiki:build'),
  // openInBrowser: () => ipcRenderer.invoke('wiki:openInBrowser'),
  // getWikiInfo: () => ipcRenderer.invoke('wiki:getInfo'),
});
