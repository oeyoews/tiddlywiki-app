import fs from 'fs';
import {
  screen,
  shell,
  ipcMain,
  app,
  BrowserWindow,
  Menu,
  nativeTheme,
  dialog,
} from 'electron';
import { setFindBar } from '@/main/find-bar';
import path from 'path';
import { initI18n, t } from '@/i18n';
import { getAppIcon } from '@/utils/icon';

import { createMenuTemplate, showWikiInfo, initWiki } from '@/utils/index';
import { config } from '@/utils/config';
import { registerContextMenu } from '@/utils/contextmenu';
import { injectScript } from '@/utils/injectScript';
import { logInit, log } from '@/utils/logger';
import { twDialog } from '@/utils/tw-dialog';
import { createTray } from '@/utils/createTray';
import { server } from '@/utils';
import { autoUpdaterInit } from '@/utils/checkUpdate';

let win: BrowserWindow;
let wikiPath: string;

// 环境变量配置
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const preload = path.join(__dirname, '../preload/index.js');

// 初始化日志
logInit();

// 创建主窗口
async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // 计算 80% 尺寸，同时保持原始宽高比
  const scaleFactor = 0.9;
  const newWidth = Math.floor(width * scaleFactor);
  const newHeight = Math.floor((newWidth / width) * height);
  win = new BrowserWindow({
    width: newWidth,
    height: newHeight,
    icon: getAppIcon(),
    skipTaskbar: false,
    show: false,
    // transparent: true,
    // vibrancy: 'appearance-based', // macOS 毛玻璃效果
    // visualEffectState: 'active', // 确保 vibrancy 启用
    webPreferences: {
      spellcheck: false,
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });
  // win.setBackgroundMaterial('mica');

  win.once('ready-to-show', () => {
    win.show();
    log.info('ready to show');
    autoUpdaterInit();

    // 设置外部链接在默认浏览器中打开
    win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    createTray(win, server); // 创建任务栏图标

    win.webContents.on('context-menu', (event, params) => {
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

  win.on('closed', () => {
    // @ts-ignore
    win = null; // 释放引用
  });

  // 捕获控制台日志
  // win.webContents.on('console-message', (event, level, message) => {
  //   log.info(`[Renderer Console] ${message}`);
  // });

  const isFirstTime = !config.get('wikiPath');
  await initWiki(wikiPath, isFirstTime, win);

  win.webContents.on('did-finish-load', () => injectScript(win));

  const menu = Menu.buildFromTemplate(createMenuTemplate(win) as any);
  Menu.setApplicationMenu(menu);
}

ipcMain.handle('update-gh-config', async (event: any, githubConfig: any) => {
  config.set('github', githubConfig);
});

ipcMain.on('tid-info', (_event, data) => {
  log.info(data, 'received tid-info');
  if (!data?.title && !data?.maybeTitle) {
    // dialog.showErrorBox(t('dialog.openfileNotSupported'), '');
    shell.openPath(path.join(config.get('wikiPath'), 'tiddlers'));
    return;
  }
  const tidPath = path.join(config.get('wikiPath'), 'tiddlers', data?.title);
  const maybeTidPath = path.join(
    config.get('wikiPath'),
    'tiddlers',
    data?.maybeTitle
  );
  if (fs.existsSync(tidPath)) {
    log.info('open file', tidPath);
    shell.showItemInFolder(tidPath);
  } else if (fs.existsSync(maybeTidPath)) {
    shell.showItemInFolder(maybeTidPath);
  } else {
    // TODO: 递归查询相应后缀的文件是否存在
    log.error(tidPath, 'not exit');
  }
});

// 初始化应用
const initApp = async () => {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  // 设置应用菜单为空
  Menu.setApplicationMenu(null);

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
    // 首次启动使用用户系统语言作为默认语言
    if (!config.get('language')) {
      log.info('init app language', lang);
    } else {
      log.info('app language is', lang);
    }
    initI18n(config);
    createWindow();

    twDialog(win);

    // 监听主题变化
    nativeTheme.on('updated', () => {
      win.setIcon(getAppIcon()!); // 更新任务栏图标
      server.tray.setImage(getAppIcon()!); // 更新托盘icon
    });
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
