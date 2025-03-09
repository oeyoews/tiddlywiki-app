const { ipcMain, app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const preload = path.join(__dirname, '../preload/index.js');
const render = path.join(__dirname, '../renderer/index.js');
const { initI18n, i18next } = require('../i18n');
const { t } = i18next;
const {
  createMenuTemplate,
  showWikiInfo,
  createTray,
  initWiki,
  config,
} = require('../utils/index.js');

let mainWindow;
let wikiPath;

Menu.setApplicationMenu(null);

const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');

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
    mainWindow.show();
    createTray(mainWindow); // 创建任务栏图标

    // 注册右键菜单
    mainWindow.webContents.on('context-menu', (event, params) => {
      const contextMenu = Menu.buildFromTemplate([
        {
          label: t('menu.toggleMenuBar'),
          click: () => {
            const isVisible = mainWindow.isMenuBarVisible();
            mainWindow.setMenuBarVisibility(!isVisible);
          },
        },
        {
          label: t('menu.copy'),
          role: 'copy',
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
        {
          label: t('menu.selectAll'),
          role: 'selectAll',
        },
        { type: 'separator' },
        {
          label: t('menu.toggleFullscreen'),
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          label: t('menu.reload'),
          role: 'reload',
        },
      ]);
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
  });

  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

// 监听更新更新
ipcMain.handle('send-tw-instance', async (event, githubConfig) => {
  config.set('github', githubConfig);
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
  console.log(wikiPath);
  configPath = config.fileName; //  存储配置路径
  // 初始化 i18n，传入 config
  await initI18n(config);
  // 启动应用
  app.on('ready', () => {
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
  console.log('Received URL:', url);
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
