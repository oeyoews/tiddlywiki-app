import { dialog, shell, ipcMain, app, BrowserWindow, Menu } from 'electron';
import { setFindBar } from '@/main/find-bar';
import path from 'path';
import { t, initI18n } from '@/i18n/index.js';
import { appIcon } from '@/utils/icon';

import { createMenuTemplate, showWikiInfo, initWiki } from '@/utils/index';
import { config } from '@/utils/config';
import { registerContextMenu } from '@/utils/contextmenu';
import { injectScript } from '@/utils/injectScript';
import { logInit, log } from '@/utils/logger';
import { twDialog } from '@/utils/tw-dialog';
import { createTray } from '@/utils/createTray';

let win: BrowserWindow;
let wikiPath: string;

// 初始化日志
logInit();

// 设置应用菜单为空
Menu.setApplicationMenu(null);

// 环境变量配置
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const preload = path.join(__dirname, '../preload/index.js');

// 创建主窗口
async function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: appIcon,
    skipTaskbar: false,
    show: false,
    webPreferences: {
      spellcheck: false,
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
    log.info('ready to show');

    // 设置外部链接在默认浏览器中打开
    win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    createTray(win); // 创建任务栏图标

    win.webContents.on('context-menu', (event: any, params: any) => {
      registerContextMenu(params, win);
    });
  });

  // 处理窗口关闭事件
  win.on('close', (event: any) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
      return false;
    }
    return true;
  });

  const isFirstTime = !config.get('wikiPath');
  await initWiki(wikiPath, isFirstTime, win);

  win.webContents.on('did-finish-load', () => injectScript(win));

  const menu = Menu.buildFromTemplate(createMenuTemplate(win) as any);
  Menu.setApplicationMenu(menu);
}

// IPC 事件处理
ipcMain.handle('send-tw-instance', async (event: any, githubConfig: any) => {
  config.set('github', githubConfig);
});

// 初始化应用
const initApp = async () => {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
    }
  });

  // 注册自定义协议
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('tiddlywiki', process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient('tiddlywiki');
  }

  wikiPath = config.get('wikiPath');
  log.info('WikiPath is', wikiPath);

  app.on('ready', async () => {
    const lang = app.getSystemLocale();
    config.set('language', lang);
    initI18n(config);
    createWindow();

    twDialog(win);
  });
};

// 应用事件监听
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    app.quit();
  }
});

app.on('browser-window-created', async (_: any, win: any) => {
  setFindBar(win, { top: 55 });
});

app.on('open-url', (event: any, url: string) => {
  event.preventDefault();
  showWikiInfo();
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('url-opened', url);
  }
  log.info('Received URL:', url);
});

app.on('before-quit', () => {
  app.isQuitting = true;
  log.info('exit');
});

// 启动应用
initApp();
