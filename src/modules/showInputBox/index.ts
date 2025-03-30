import { processEnv } from '@/main';
import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';

export function showInputBox(
  parentWindow: BrowserWindow,
  message = '请输入内容'
) {
  return new Promise((resolve) => {
    let inputWin = new BrowserWindow({
      width: 400,
      height: 200,
      parent: parentWindow,
      modal: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      autoHideMenuBar: true,
      frame: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        spellcheck: false,
      },
    });

    inputWin.loadFile(path.join(processEnv.VITE_PUBLIC, 'input.html'));

    // 传递消息到渲染进程
    inputWin.webContents.once('did-finish-load', () => {
      inputWin.webContents.send('set-message', message);
    });

    ipcMain.once('input-value', (event, value) => {
      resolve(value);
      inputWin.close();
    });
  });
}
