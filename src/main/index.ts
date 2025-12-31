import {
  screen,
  shell,
  app,
  BrowserWindow,
  Menu,
  nativeTheme,
  BrowserWindowConstructorOptions,
} from 'electron';
import { getAppIcon } from '@/utils/icon';

import { createMenuTemplate, initWiki } from '@/utils/index';
import { config, DEFAULT_WIKI_DIR } from '@/utils/config';
import { logInit, log, cleanupOldLogs } from '@/utils/logger';
import { server } from '@/utils';
import { autoUpdaterInit } from '@/utils/checkUpdate';
import path from 'path';
import { getPlatform } from '@/utils/getPlatform';
import { trackWindowState } from '@/utils/trackWindowState';
import { registerIpcEvent } from './ipc';
import { importWeb } from '@/utils/importWeb';

let win: BrowserWindow;
let wikiPath: string;
export const TWProtocol = 'tiddlywiki';

const startTime = performance.now(); // 记录启动时间

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

export const TPlatform = getPlatform();

const preload = path.join(process.env.DIST, 'preload/index.js');

// 初始化日志
logInit();

// 创建主窗口
async function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const scaleFactor = 0.9;
  const defaultWidth = Math.floor(width * scaleFactor);
  const defaultHeight = Math.floor((defaultWidth / width) * height);
  let winState: IWinState | null = null;
  const enableWinState = config.get('winState');
  if (!enableWinState) {
    config.set('window', null);
  } else {
    winState = config.get('window');
  }

  const winOptions: BrowserWindowConstructorOptions = {
    // @ts-ignore
    height: defaultHeight,
    // @ts-ignore
    width: defaultWidth,
    ...winState, // ??
    icon: getAppIcon(),
    skipTaskbar: false,
    show: false,
    hasShadow: false,
    resizable: true,
    movable: true,
    minWidth: 800,
    minHeight: 600,
    // minWidth: Number((defaultWidth * 0.6).toFixed(0)),
    // minHeight: Number((defaultHeight * 0.6).toFixed(0)),
    webPreferences: {
      spellcheck: false,
      preload,
      nodeIntegration: false,
      // webgl: true,
      contextIsolation: true,
      webSecurity: false,
    },
    // fullscreen: winState.isFullScreen,
  };

  win = new BrowserWindow(winOptions);

  win.once('ready-to-show', () => {
    // nativeTheme.themeSource = 'dark';
    win.show();
    win.focus();
    log.info('Ready to show');
    if (!app.isPackaged) {
      console.log(
        `Electron Main Process Startup Time(to show): ${(
          performance.now() - startTime
        ).toFixed(2)} ms`
      );
    }
    // log.info('ARCH is', TPlatform);
    log.info('Platform is', process.platform);
    import('../../package.json').then(({ version, name }) => {
      log.info(name, 'version:', version);
    });

    if (enableWinState) {
      if (winState?.isFullScreen) {
        win.setFullScreen(true);
      } else {
        if (winState?.isMaximized) {
          win.maximize();
        }
      }
      trackWindowState(win);
    }

    autoUpdaterInit();
    cleanupOldLogs();

    // 设置外部链接在默认浏览器中打开
    win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    win.webContents.on('will-navigate', (event, navigationUrl) => {
      try {
        const parsedUrl = new URL(navigationUrl);
        // NOTE: location.reload 会触发此事件
        if (parsedUrl.port == String(config.get('defaultPort')) && parsedUrl.protocol === 'http:') {
          return;
        }

        // 如果是外部链接（http/https 协议），阻止导航并在浏览器中打开
        if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
          event.preventDefault();
          shell.openExternal(navigationUrl);
          return;
        }

      } catch (error) {
        log.info('will-navigate: URL parse error, allowing navigation', navigationUrl);
      }
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
      if (process.platform === 'darwin') {
        // MacOS 下使用 hide() 而不是直接关闭窗口
        app.hide();
      } else {
        win.hide();
      }
      return false;
    }
    return true;
  });

  // 添加 MacOS 下的 activate 事件处理
  app.on('activate', () => {
    if (process.platform === 'darwin') {
      win.show();
    }
  });

  // 捕获控制台日志
  // win.webContents.on('console-message', (event, level, message) => {
  //   log.info(`[Renderer Console] ${message}`);
  // });

  wikiPath = config.get('wikiPath');

  // 考虑到用户手动清空该配置
  if (!wikiPath) {
    config.set('wikiPath', DEFAULT_WIKI_DIR);
    wikiPath = DEFAULT_WIKI_DIR;
  }
  log.info('WikiPath is', wikiPath);
  await initWiki(wikiPath, win);

  // 获取页面标题并设置窗口标题
  win.webContents.on('dom-ready', async () => {
    const pageTitle = win.webContents.getTitle();
    win.setTitle(`${pageTitle} - ${config.get('wikiPath')}`);
  });

  win.webContents.on('did-finish-load', async () => {
    const hasInjected = await win.webContents.executeJavaScript(
      'window.__TW_SCRIPT_INJECTED__'
    );

    // window.addEventListener('beforeunload', () => {
    //   window.__TW_SCRIPT_INJECTED__ = false;
    // });
    if (!hasInjected) {
      await win.webContents.executeJavaScript(
        ` window.__TW_SCRIPT_INJECTED__ = true;`
      );
      const { injectRenderScript } = await import('@/utils/injectScript');
      injectRenderScript(win, () => importWeb(win, process.argv));
      const { injectScript } = await import('@/utils/injectScript');
      injectScript(win);
    } else {
      log.info('Scripts already injected, skipping...');
    }
  });

  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

// 初始化应用
const initApp = async () => {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    app.quit();
    return;
  }

  // 设置应用菜单为空
  Menu.setApplicationMenu(null);

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
    const { initI18n } = await import('@/i18n');
    await initI18n(config);
    await createWindow();
    registerIpcEvent(win);

    const { twDialog } = await import('@/utils/tw-dialog');

    twDialog(win);

    // 监听主题变化
    nativeTheme.on('updated', () => {
      log.info('Update theme');
      win.setIcon(getAppIcon()!); // 更新任务栏图标
      if (server?.tray) {
        server.tray.setImage(getAppIcon()!); // 更新托盘icon
      }
    });
  });

  app.on('second-instance', (event: any, argv: any) => {
    importWeb(win, argv);
    if (win) {
      if (win.isMinimized()) win.restore();
      if (!win.isVisible()) win.show();
      win.focus();
    }
  });

  // 注册自定义协议
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(TWProtocol, process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(TWProtocol);
  }
};

// 应用事件监听
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    app.quit();
  } else {
    win.hide();
  }
});

app.on('will-finish-launching', () => {
  app.on('open-url', (event: any, url: string) => {
    event.preventDefault();
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      // @ts-ignore
      importWeb(win, null, url);
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  log.info('App Quit.');
});

// 启动应用
initApp();
