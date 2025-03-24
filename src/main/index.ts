import { dialog, shell, ipcMain, app, BrowserWindow, Menu } from 'electron';
import { setFindBar } from '@/main/find-bar';
import path from 'path';
import { t, initI18n } from '@/i18n/index.js';
import { appIcon } from '@/utils/icon';
const { autoUpdater } = require('electron-updater');

import {
  createMenuTemplate,
  showWikiInfo,
  createTray,
  initWiki,
} from '@/utils/index';
import { config } from '@/utils/config';
import { registerContextMenu } from '@/utils/contextmenu';
import { injectScript } from '@/utils/injectScript';

let win: BrowserWindow;
let wikiPath: string;

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const preload = path.join(__dirname, '../preload/index.js');
import { logInit, log } from '@/utils/logger';

logInit();

Menu.setApplicationMenu(null);

// 修改 createWindow 函数中的菜单创建部分
async function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: appIcon,
    skipTaskbar: false, // 添加此行以隐藏任务栏图标
    show: false,
    webPreferences: {
      spellcheck: false, // TODO 配置
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
    log.info('ready to show');
    autoUpdater.autoDownload = false;

    // if (!app.isPackaged) {
    //   const filter = { urls: ['<all_urls>'] }; // 监听所有 URL

    //   session.defaultSession.webRequest.onBeforeRequest(
    //     filter,
    //     (details, callback) => {
    //       console.log(`\nrequest URL:(${details.id})`, details.url);
    //       console.log('request method:', details.method);
    //       callback({ cancel: false }); // 继续请求
    //     }
    //   );
    // }

    // autoUpdater.checkForUpdatesAndNotify().then((res) => {
    //   console.log(res);
    // });

    // 设置所有外部链接在默认浏览器中打开
    win.webContents.setWindowOpenHandler(({ url }: { url: string }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    createTray(win); // 创建任务栏图标

    win.webContents.on('context-menu', (event: any, params: any) => {
      registerContextMenu(params, win);
    });
  });

  // 处理窗口关闭按钮事件
  win.on('close', (event: any) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
      return false;
    }
    return true;
  });
  // 检查是否首次启动
  const isFirstTime = !config.get('wikiPath');

  // 初始化并加载 wiki
  await initWiki(wikiPath, isFirstTime, win);

  win.webContents.on('did-finish-load', () => injectScript(win));

  const menu = Menu.buildFromTemplate(createMenuTemplate() as any);
  Menu.setApplicationMenu(menu);
}

// 监听更新更新
ipcMain.handle('send-tw-instance', async (event: any, githubConfig: any) => {
  config.set('github', githubConfig);
});

ipcMain.on(
  'custom-dialog',
  (
    event: any,
    {
      type,
      message,
    }: {
      type: DialogType;
      message: string;
    }
  ) => {
    const options = {
      type: type === 'confirm' ? 'question' : 'info',
      buttons:
        type === 'confirm'
          ? [t('dialog.cancel'), t('dialog.confirm')]
          : [t('dialog.confirm')],
      defaultId: type === 'confirm' ? 1 : 0,
      title: t('dialog.confirm'),
      message,
    };
    const result = dialog.showMessageBoxSync(win, options as any);
    event.returnValue = type === 'confirm' ? result === 1 : undefined; // confirm 返回 true/false，alert 无返回值
  }
);

const initApp = async () => {
  // 使用单实例锁
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    // 如果不是第一个实例，直接退出
    app.quit();
    return;
  } else {
    // 监听第二个实例被运行时
    app.on(
      'second-instance',
      (event: any, commandLine: any, workingDirectory: string) => {
        if (win) {
          if (win.isMinimized()) {
            win.restore();
          }
          if (!win.isVisible()) {
            win.show();
          }
          win.focus();
        }
      }
    );
  }
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
  // 初始化 wikiPath
  wikiPath = config.get('wikiPath');
  log.info('WikiPath is', wikiPath);
  // 启动应用
  app.on('ready', async () => {
    const lang = app.getSystemLocale();
    config.set('language', lang); // 获取系统语言
    // 初始化 i18n，传入 config
    initI18n(config);
    createWindow();
    // app.on('activate', () => {
    //   if (BrowserWindow.getAllWindows().length === 0) {
    //     createWindow();
    //   }
    // });
  });
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    app.quit();
  }
});

// create findbar
app.on('browser-window-created', async (_: any, win: any) => {
  setFindBar(win, {
    top: 55,
  });
});

// 添加 before-quit 事件处理
app.on('before-quit', () => {
  app.isQuitting = true;
});

// macos (untest)
app.on('open-url', (event: any, url: string) => {
  event.preventDefault();
  showWikiInfo();
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    win.webContents.send('url-opened', url);
  }
  log.info('Received URL:', url);
});

// 在文件末尾添加清理函数
app.on('before-quit', () => {
  log.info('exit');
});

initApp();
