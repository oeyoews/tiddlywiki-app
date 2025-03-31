import fs from 'fs';
import {
  screen,
  shell,
  ipcMain,
  app,
  BrowserWindow,
  Menu,
  nativeTheme,
} from 'electron';
import { getAppIcon } from '@/utils/icon';

import { createMenuTemplate, showWikiInfo, initWiki } from '@/utils/index';
import { config } from '@/utils/config';
import { logInit, log } from '@/utils/logger';
import { server } from '@/utils';
import { autoUpdaterInit } from '@/utils/checkUpdate';
import { showInputBox } from '@/modules/showInputBox';
import path from 'path';

let win: BrowserWindow;
let wikiPath: string;

const startTime = performance.now(); // 记录启动时间
const tempDir = app.getPath('temp');

// 环境变量配置
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
process.env.APP_ROOT = path.join(__dirname, '..');

process.env.DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : process.env.DIST;

export const processEnv = {
  VITE_PUBLIC: process.env.VITE_PUBLIC,
  VITE_DIST: process.env.DIST,
};

const preload = path.join(process.env.DIST, 'preload/index.js');

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
    if (!app.isPackaged) {
      console.log(
        `Electron Main Process Startup Time(to show): ${(
          performance.now() - startTime
        ).toFixed(2)} ms`
      );
    }
    win.show();
    log.info('ready to show');
    autoUpdaterInit();

    // 设置外部链接在默认浏览器中打开
    win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // createTray(win, server); // 创建任务栏图标
    import('@/utils/createTray').then(({ createTray }) =>
      createTray(win, server)
    );
    win.webContents.on('context-menu', async (event, params) => {
      const { registerContextMenu } = await import('@/utils/contextmenu');
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

  win.webContents.on('did-finish-load', async () => {
    const { injectScript } = await import('@/utils/injectScript');
    injectScript(win);
  });

  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

// 主进程
ipcMain.handle('get-data', async (_event, data) => {
  console.log('original data', data);
  const minifiedImagePath = path.join(tempDir, 'pngquant.png');
  fs.writeFileSync(minifiedImagePath, 'data', 'utf-8');
  // pngquant minify it
  return 'new image data';
});

// 监听渲染进程请求并调用 `showInputBox`
ipcMain.handle('show-input-box', async (event) => {
  const result = await showInputBox(win, '请输入你的名称:');
  return result;
});

ipcMain.handle('update-gh-config', async (event: any, githubConfig: any) => {
  config.set('github', githubConfig);
});

ipcMain.on('tid-info', (_event, data) => {
  const tiddlerFolder = path.join(config.get('wikiPath'), 'tiddlers');
  log.info(data, 'received tid-info');
  if (!data?.title) {
    // dialog.showErrorBox(t('dialog.openfileNotSupported'), '');
    log.info('open  default fodler');
    shell.openPath(tiddlerFolder);
    return;
  }
  const tidPath = path.join(tiddlerFolder, data.title);
  let maybeTidPath = null;
  if (data?.maybeTitle) {
    maybeTidPath = path.join(
      config.get('wikiPath'),
      'tiddlers',
      data?.maybeTitle
    );
  }
  if (fs.existsSync(tidPath)) {
    log.info('open file', tidPath);
    shell.showItemInFolder(tidPath);
  } else if (maybeTidPath && fs.existsSync(maybeTidPath)) {
    shell.showItemInFolder(maybeTidPath);
    log.info('open file form maybeTitle');
  } else {
    const subwikiTid = path.join(tiddlerFolder, 'subwiki', data.title);
    // 尝试读取 subwiki
    if (fs.existsSync(subwikiTid)) {
      shell.showItemInFolder(subwikiTid);
    } else {
      // 默认打开 文件夹
      shell.openPath(tiddlerFolder);
    }
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
    if (!app.isPackaged) {
      console.log(
        `Electron Main Process Startup Time(ready): ${(
          performance.now() - startTime
        ).toFixed(2)} ms`
      );
    }
    const lang = app.getSystemLocale();
    // 首次启动使用用户系统语言作为默认语言
    if (!config.get('language')) {
      log.info('init app language', lang);
    } else {
      log.info('app language is', lang);
    }
    createWindow();

    const { initI18n } = await import('@/i18n');
    const { twDialog } = await import('@/utils/tw-dialog');

    initI18n(config);
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
  log.info('tiddlywiki app before quit.');
});

// 启动应用
initApp();
