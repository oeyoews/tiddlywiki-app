// @ts-nocheck

import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  alert: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'alert', message }),
  confirm: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'confirm', message }),
  onConfigGithub: (callback) => ipcRenderer.on('config-github', callback),
  // markdown importer
  onImportMarkdown: (callback) => ipcRenderer.on('import-markdown', callback),
  // onShowWikiInfo: (callback) => ipcRenderer.on('show-wiki-info', callback),
  sendGHConfig: (data) => ipcRenderer.invoke('update-gh-config', data),
  // 双向
  onTidInfo: (callback) =>
    ipcRenderer.on('update-tid', (_event, value) => callback(value)),
  sendTidInfo: (value) => ipcRenderer.send('tid-info', value),

  // 接收图片坐标
  onTitleFetched: (callback) =>
    ipcRenderer.on('title-fetched', (_event, value) => callback(value)),

  startFetchData: async (data) => ipcRenderer.invoke('get-data', data),

  onConfetti: (callback) => ipcRenderer.on('wiki-imported', callback),

  // onTwInstanceUpdate: (callback) =>
  //   ipcRenderer.on('tw-instance-update', callback),
  // openWiki: () => ipcRenderer.invoke('dialog:openWiki'),
  // buildWiki: () => ipcRenderer.invoke('wiki:build'),
  // openInBrowser: () => ipcRenderer.invoke('wiki:openInBrowser'),
  // getWikiInfo: () => ipcRenderer.invoke('wiki:getInfo'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
