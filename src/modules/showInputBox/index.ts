import { processEnv } from '@/main';
import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';

let inputWin: BrowserWindow | null = null;

export function showInputBox(
  parentWindow: BrowserWindow,
  message: string = 'Please input ...',
  type: 'text' | 'password' = 'text',
  inputValue: string = ''
): Promise<string> {
  return new Promise((resolve) => {
    if (inputWin) {
      inputWin.show();
      inputWin?.webContents.send('set-title', message);
      inputWin?.webContents.send('set-inputvalue', {
        inputValue,
        type,
      });
      inputWin.focus();
    } else {
      inputWin = new BrowserWindow({
        width: 400,
        height: 150,
        parent: parentWindow,
        modal: true,
        resizable: false,
        minimizable: false,
        maximizable: false,
        autoHideMenuBar: true,
        frame: false,
        show: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          spellcheck: false,
        },
      });
      inputWin.loadFile(path.join(processEnv.VITE_PUBLIC, 'input.html'));

      inputWin.once('ready-to-show', () => {
        inputWin!.show();
        inputWin?.focus();
      });
    }

    inputWin.webContents.on('did-finish-load', () => {
      inputWin?.webContents.send('set-title', message);
      inputWin?.webContents.send('set-inputvalue', { inputValue, type });
    });

    ipcMain.on('input-value', (event, value) => {
      resolve(value);
      if (inputWin) {
        inputWin.hide();
      }
    });
  });
}
