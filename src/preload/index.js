const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendTiddlyWikiInstance: (twInstance) => {
    // console.log(twInstance, 'saveed instance');
    ipcRenderer.invoke('send-tw-instance', twInstance);
  },

  onConfigGithub: (callback) => ipcRenderer.on('config-github', callback),

  // onTwInstanceUpdate: (callback) =>
  //   ipcRenderer.on('tw-instance-update', callback),
  // openWiki: () => ipcRenderer.invoke('dialog:openWiki'),
  // buildWiki: () => ipcRenderer.invoke('wiki:build'),
  // openInBrowser: () => ipcRenderer.invoke('wiki:openInBrowser'),
  // getWikiInfo: () => ipcRenderer.invoke('wiki:getInfo'),
});
