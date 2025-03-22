const {
  dialog,
  shell,
  ipcMain,
  app,
  BrowserWindow,
  Menu,
} = require('electron');
const setFindBar = require('find-bar');
const path = require('path');
const preload = path.join(__dirname, '../preload/index.js');
const render = path.join(__dirname, '../renderer/index.js');
const swal = path.join(__dirname, '../lib/sweetalert.min.js');
import { initI18n, i18next } from '../i18n/index.js';
const { t } = i18next;
const { autoUpdater } = require('electron-updater');
const log = require('electron-log/main');
const { fileURLToPath } = require('url');

import {
  createMenuTemplate,
  showWikiInfo,
  createTray,
  initWiki,
  config,
} from '../utils/index.js';

let mainWindow;
let wikiPath;

const date = new Date().toISOString().split('T').shift().replace('-', '/'); // 替换第一个-
log.transports.file.resolvePathFn = () =>
  path.join(app.getPath('logs'), date, `main.log`);

Menu.setApplicationMenu(null);

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const iconPath = path.join(process.env.VITE_PUBLIC, 'assets/tray-icon.png');

// 修改 createWindow 函数中的菜单创建部分
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: iconPath,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: true,
    skipTaskbar: false, // 添加此行以隐藏任务栏图标
    // backgroundColor: '#2e2c29',
    show: false,
    // alwaysOnTop: true,
    // autoHideMenuBar: true, // 隐藏菜单栏，按 `Alt` 可暂时显示
    // frame: false,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   color: 'transparent',
    //   symbolColor: 'transparent',
    //   height: 10,
    // },
    webPreferences: {
      spellcheck: false,
      preload,
      // devTools: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    log.info('ready to show');
    autoUpdater.autoDownload = false;

    // 禁用 Ctrl+A 全选
    // mainWindow.webContents.on('before-input-event', (event, input) => {
    //   if (input.control && input.key.toLowerCase() === 'a') {
    //     event.preventDefault();
    //   }
    // });

    // autoUpdater.checkForUpdatesAndNotify().then((res) => {
    //   console.log(res);
    // });

    mainWindow.show();
    // 设置所有外部链接在默认浏览器中打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });
    createTray(mainWindow); // 创建任务栏图标

    // 注册右键菜单
    mainWindow.webContents.on('context-menu', (event, params) => {
      const menuTemplate = [
        {
          accelerator: 'Alt+M',
          label: t('menu.toggleMenuBar'),
          click: () => {
            const isVisible = mainWindow.isMenuBarVisible();
            mainWindow.setMenuBarVisibility(!isVisible);
          },
        },
      ];

      // 如果右键点击的是图片，添加复制图片选项
      if (params.mediaType === 'image') {
        menuTemplate.push(
          {
            label: t('menu.copyImage'),
            click: () => {
              mainWindow.webContents.copyImageAt(params.x, params.y);
            },
          }
          // {
          //   label: t('menu.saveImageAs'),
          //   click: async () => {
          //     try {
          //       // 处理文件名
          //       let defaultFileName;
          //       if (params.srcURL.startsWith('data:')) {
          //         // 处理 base64 图片
          //         const mimeMatch = params.srcURL.match(/^data:image\/(\w+);/);
          //         const ext = mimeMatch ? mimeMatch[1] : 'png';
          //         defaultFileName = `image-${Date.now()}.${ext}`;
          //       } else {
          //         defaultFileName = path.basename(params.srcURL);
          //       }

          //       const result = await dialog.showSaveDialog({
          //         defaultPath: defaultFileName,
          //         filters: [
          //           {
          //             name: 'Images',
          //             extensions: ['png', 'jpg', 'jpeg', 'gif'],
          //           },
          //         ],
          //       });
          //       if (!result.canceled) {
          //         let buffer;
          //         if (params.srcURL.startsWith('data:')) {
          //           // 处理 base64 图片
          //           const base64Data = params.srcURL.split(',')[1];
          //           buffer = Buffer.from(base64Data, 'base64');
          //         } else {
          //           // 处理普通 URL 图片
          //           const response = await fetch(params.srcURL);
          //           buffer = Buffer.from(await response.arrayBuffer());
          //         }
          //         fs.writeFileSync(result.filePath, buffer);
          //       }
          //     } catch (err) {
          //       dialog.showErrorBox(
          //         t('dialog.error'),
          //         t('dialog.saveImageError')
          //       );
          //     }
          //   },
          // }
        );
      }

      // 添加其他常规菜单项
      menuTemplate.push(
        {
          label: t('menu.copy'),
          role: 'copy',
          accelerator: 'CmdOrCtrl+C',
          enabled: params.editFlags.canCopy,
        },
        {
          label: t('menu.paste'),
          role: 'paste',
          enabled: params.editFlags.canPaste,
        },
        {
          label: t('menu.cut'),
          role: 'cut',
          enabled: params.editFlags.canCut,
        },
        { type: 'separator' },
        // {
        //   label: t('menu.selectAll'),
        //   role: 'selectAll',
        // },
        // { type: 'separator' },
        {
          label: t('menu.toggleFullscreen'),
          accelerator: 'F11',
          role: 'togglefullscreen',
          // click: () => {
          //   mainWindow.setFullScreen(!mainWindow.isFullScreen());
          // },
        },
        {
          label: t('menu.reload'),
          role: 'reload',
          accelerator: 'CmdOrCtrl+R',
        }
      );

      const contextMenu = Menu.buildFromTemplate(menuTemplate);
      contextMenu.popup();
    });
  });

  // 处理窗口最小化事件
  // mainWindow.on('minimize', (event) => {
  //   event.preventDefault();
  //   mainWindow.minimize();
  // });

  // 处理窗口关闭按钮事件
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    return true;
  });
  // 检查是否首次启动
  const isFirstTime = !config.get('wikiPath');

  // 初始化并加载 wiki
  await initWiki(wikiPath, isFirstTime, mainWindow);

  // 注入渲染脚本
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      const script = document.createElement('script');
      script.src = 'file://${render.replace(/\\/g, '/')}';
      document.body.appendChild(script);
    `);
    mainWindow.webContents.executeJavaScript(`
      const script2 = document.createElement('script');
      script2.src = 'file://${swal.replace(/\\/g, '/')}';
      document.body.appendChild(script2);
    `);
  });

  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

// 监听更新更新
ipcMain.handle('send-tw-instance', async (event, githubConfig) => {
  config.set('github', githubConfig);
});

ipcMain.on('custom-dialog', (event, { type, message }) => {
  // const win = BrowserWindow.getFocusedWindow(); // 获取当前窗口
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
  const result = dialog.showMessageBoxSync(mainWindow, options);
  event.returnValue = type === 'confirm' ? result === 1 : undefined; // confirm 返回 true/false，alert 无返回值
});

// 添加 IPC 处理程序
// ipcMain.handle('dialog:openWiki', openWiki);
// ipcMain.handle('dialog:createWiki', createNewWiki);
// ipcMain.handle('wiki:build', buildWiki);
// ipcMain.handle('wiki:openInBrowser', () => {
//   if (currentPort) {
//     shell.openExternal(`http://localhost:${currentPort}`);
//   }
// });
// ipcMain.handle('wiki:getInfo', () => {
//   return {
//     wikiPath: config.get('wikiPath'),
//     port: currentPort,
//   };
// });

// 修改 initApp 函数
const initApp = async () => {
  // 单实例
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    // 如果不是第一个实例，直接退出
    app.quit();
    return;
  } else {
    // 监听第二个实例被运行时
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      showMainWindow();
    });
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

initApp();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    app.quit();
  }
});

// create findbar
app.on('browser-window-created', async (_, win) => {
  setFindBar(win, {
    top: 55,
  });
});

// 添加 before-quit 事件处理
app.on('before-quit', () => {
  app.isQuitting = true;
});

// macos (untest)
app.on('open-url', (event, url) => {
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

function showMainWindow() {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }
    mainWindow.focus();
  }
}
