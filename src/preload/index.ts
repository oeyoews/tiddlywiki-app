// @ts-nocheck

import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  alert: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'alert', message }),
  confirm: (message) =>
    ipcRenderer.sendSync('custom-dialog', { type: 'confirm', message }),
  onShowQRCode: (callback) => ipcRenderer.on('show-qrcode', callback),
  // markdown importer
  onImportMarkdown: (callback) => ipcRenderer.on('import-markdown', callback),
  onImportMDFromWeb: (callback) =>
    ipcRenderer.on('open-url', (e, data) => callback(data)),

  // github
  onConfigGithub: (callback) =>
    ipcRenderer.on('config-github', (_event, data) => callback(data)),

  onGetGHConfig: (cbl) => ipcRenderer.on('get-gh-config', cbl),
  sendGHConfig: (data) => ipcRenderer.send('update-gh-config', data),

  // 双向
  onTidInfo: (callback) =>
    ipcRenderer.on('update-tid', (_event, value) => callback(value)),
  onTidInfoVscode: (callback) =>
    ipcRenderer.on('update-tid-vscode', (_event, value) => callback(value)),
  sendTidInfo: (value) => ipcRenderer.send('tid-info', value),
  sendTidInfoVscode: (value) => ipcRenderer.send('tid-info-vscode', value),

  // 接收图片坐标
  onTitleFetched: (callback) =>
    ipcRenderer.on('title-fetched', (_event, value) => callback(value)),

  // 渲染进程向主进程发起的双向通信
  startFetchData: async (data) => ipcRenderer.invoke('get-data', data),
  startFetchRSSData: async (data) => ipcRenderer.invoke('fetchRss', data),

  onConfetti: (callback) => ipcRenderer.on('wiki-imported', callback),

  // onTwInstanceUpdate: (callback) =>
  //   ipcRenderer.on('tw-instance-update', callback),
  // openWiki: () => ipcRenderer.invoke('dialog:openWiki'),
  // buildWiki: () => ipcRenderer.invoke('wiki:build'),
  // openInBrowser: () => ipcRenderer.invoke('wiki:openInBrowser'),
  // getWikiInfo: () => ipcRenderer.invoke('wiki:getInfo'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
