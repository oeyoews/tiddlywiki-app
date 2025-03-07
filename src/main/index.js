const {
  ipcMain,
  shell,
  app,
  BrowserWindow,
  dialog,
  Menu,
  Tray,
} = require('electron');
const path = require('path');
const fs = require('fs');
const { TiddlyWiki } = require('tiddlywiki');
const { Conf: Config } = require('electron-conf');
const getPorts = require('get-port').default;
const preload = path.join(__dirname, '../preload/index.js');
const { initI18n, i18next } = require('../i18n');
const { t } = i18next;
// 在文件顶部添加 package.json 的引入
const packageInfo = require('../../package.json');
const { isEmptyDirectory } = require('../utils/index.js');

let config;
let wikiPath;
let mainWindow;
let currentServer = null;
let currentPort = null;
let tray = null;
let configPath = null;

const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
const DEFAULT_PORT = 8080;
const DEFAULT_WIKI_DIR = path.resolve('wiki');
// 添加显示 Wiki 信息的函数
// 修改 showWikiInfo 函数
async function showWikiInfo() {
  const info = await dialog.showMessageBox({
    type: 'info',
    title: t('app.about'),
    message: t('app.name'),
    detail: `${t('app.version')}: ${packageInfo.version}\n${t(
      'app.currentWikiPath'
    )}：${wikiPath}\n${t('app.runningPort')}：${
      currentPort || t('app.notRunning')
    }\n${t('app.configPath')}：${configPath}`,
  });
}
// 修改 createTray 函数中的菜单项
function createTray() {
  if (!tray) {
    tray = new Tray(iconPath);
  }
  tray.setToolTip(t('tray.tooltip'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('tray.showWindow'),
      click: () => {
        mainWindow.show();
      },
    },
    {
      label: t('tray.openInBrowser'),
      click: () => {
        if (currentServer && currentPort) {
          shell.openExternal(`http://localhost:${currentPort}`);
        }
      },
    },
    { type: 'separator' },
    {
      label: t('menu.language'),
      submenu: [
        {
          label: '简体中文',
          type: 'radio',
          checked: i18next.language === 'zh-CN',
          click: () => switchLanguage('zh-CN'),
        },
        {
          label: 'English',
          type: 'radio',
          checked: i18next.language === 'en-US',
          click: () => switchLanguage('en-US'),
        },
      ],
    },
    { type: 'separator' },
    {
      label: t('tray.about'),
      click: showWikiInfo,
    },
    {
      label: t('tray.exit'),
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  // 修改点击事件处理，实现窗口切换
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      } else {
        mainWindow.minimize();
      }
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function buildWiki() {
  try {
    const bootPath = path.join(wikiPath, 'tiddlywiki.info');
    let twInfo = JSON.parse(fs.readFileSync(bootPath, 'utf8'));

    // 检查并添加构建配置，修复导入的文件夹无法构建
    if (!twInfo.build || !twInfo.build.index) {
      twInfo.build = {
        ...twInfo.build,
        index: [
          '--render',
          '$:/plugins/tiddlywiki/tiddlyweb/save/offline',
          'index.html',
          'text/plain',
        ],
      };
      fs.writeFileSync(bootPath, JSON.stringify(twInfo, null, 4), 'utf8');
    }

    const { boot } = TiddlyWiki();
    boot.argv = [wikiPath, '--build', 'index'];
    await boot.boot(() => {
      console.log(t('log.startBuild'));
    });

    const outputPath = path.join(wikiPath, 'output', 'index.html');
    const result = await dialog.showMessageBox({
      type: 'info',
      title: t('dialog.buildComplete'),
      message: t('dialog.buildCompleteMessage'),
      buttons: [
        t('dialog.preview'),
        t('dialog.showInFolder'),
        t('dialog.close'),
      ],
      defaultId: 0,
      cancelId: 2,
    });

    if (result.response === 0) {
      shell.openExternal(`file://${outputPath}`);
    } else if (result.response === 1) {
      shell.showItemInFolder(outputPath);
    }
  } catch (err) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.buildError', { message: err.message })
    );
  }
}

async function initWiki(wikiFolder, isFirstTime = false) {
  try {
    if (isFirstTime) {
      const result = await dialog.showOpenDialog({
        title: t('dialog.selectWikiFolder'),
        properties: ['openDirectory'],
        message: t('dialog.selectWikiFolderMessage'),
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        if (path.basename(selectedPath) === 'tiddlers') {
          dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
          return await initWiki(wikiFolder, true);
        }
        // wikiPath = path.join(selectedPath, 'wiki');
        wikiPath = selectedPath;
        wikiFolder = wikiPath;
        config.set('wikiPath', wikiPath);
      }
    }

    const bootPath = path.join(wikiFolder, 'tiddlywiki.info');
    console.log('wikifolder', wikiPath);

    if (!fs.existsSync(bootPath)) {
      const { boot } = TiddlyWiki();
      if (!isEmptyDirectory(wikiFolder)) {
        wikiFolder = DEFAULT_WIKI_DIR;
        if (!isFirstTime) {
          return;
        }
      }
      boot.argv = [wikiFolder, '--init', 'server'];
      await boot.boot(() => {
        console.log(t('log.startInit'));
      });
      console.log(t('log.finishInit'));
    }

    if (currentServer) {
      currentServer = null;
    }

    // 获取可用端口
    currentPort = await getPorts({ port: DEFAULT_PORT });

    const { boot: twBoot } = TiddlyWiki();
    twBoot.argv = [wikiFolder, '--listen', `port=${currentPort}`];

    const startServer = () => {
      // console.log(`start begin: http://localhost:${currentPort}`);
      mainWindow.loadURL(`http://localhost:${currentPort}`);
      mainWindow.webContents.once('did-finish-load', () => {
        // 获取页面标题并设置窗口标题
        const pageTitle = mainWindow.webContents.getTitle();
        mainWindow.setTitle(`${pageTitle} - ${wikiFolder}`);
      });
    };

    currentServer = twBoot;
    twBoot.boot(startServer);
  } catch (err) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.initError', { message: err.message })
    );
  }
}
async function importSingleFileWiki() {
  try {
    const result = await dialog.showOpenDialog({
      title: t('dialog.selectHtmlFile'),
      filters: [{ name: t('dialog.htmlFilter'), extensions: ['html'] }],
      properties: ['openFile'],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const htmlPath = result.filePaths[0];
      const targetFolder = await dialog.showOpenDialog({
        title: t('dialog.selectImportFolder'),
        properties: ['openDirectory'],
        message: t('dialog.selectImportFolderMessage'),
      });

      if (!targetFolder.canceled && targetFolder.filePaths.length > 0) {
        const targetPath = targetFolder.filePaths[0];

        const { boot } = TiddlyWiki();
        boot.argv = ['--load', htmlPath, '--savewikifolder', targetPath];
        await boot.boot(() => {
          console.log(t('log.startImport'));
        });

        // 更新当前 Wiki 路径并重新初始化
        wikiPath = targetPath;
        config.set('wikiPath', wikiPath);
        await initWiki(wikiPath);

        dialog.showMessageBox({
          type: 'info',
          title: t('dialog.importSuccess'),
          message: t('dialog.importSuccessMessage'),
        });
      }
    }
  } catch (err) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.importError', { message: err.message })
    );
  }
}
// 修改切换语言的函数
async function switchLanguage(lang) {
  config.set('language', lang);
  await i18next.changeLanguage(lang);

  // 更新菜单
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);

  // 更新托盘菜单
  createTray();

  // 显示语言切换成功提示
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: t('settings.languageChanged'),
  //   message: t('settings.restartTips'),
  // });
}

// 添加创建菜单模板的函数
function createMenuTemplate() {
  return [
    {
      label: t('menu.file'),
      submenu: [
        {
          label: t('menu.openWiki'),
          click: openFolderDialog,
        },
        {
          label: t('menu.importWiki'),
          click: importSingleFileWiki,
        },
        {
          label: t('menu.buildWiki'),
          click: buildWiki,
        },
        {
          label: t('menu.openInBrowser'),
          click: () => {
            if (currentServer && currentPort) {
              shell.openExternal(`http://localhost:${currentPort}`);
            }
          },
        },
        {
          label: t('menu.openFolder'),
          click: () => {
            if (wikiPath) {
              shell.showItemInFolder(wikiPath);
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.exit'),
          role: 'quit',
        },
      ],
    },
    {
      label: t('menu.settings'),
      submenu: [
        {
          label: t('menu.language'),
          submenu: [
            {
              label: '简体中文',
              type: 'radio',
              checked: i18next.language === 'zh-CN',
              click: () => switchLanguage('zh-CN'),
            },
            {
              label: 'English',
              type: 'radio',
              checked: i18next.language === 'en-US',
              click: () => switchLanguage('en-US'),
            },
          ],
        },
      ],
    },
    {
      label: t('menu.help'),
      submenu: [
        {
          label: t('menu.devTools'),
          click: () => mainWindow.webContents.openDevTools({ mode: 'right' }),
        },
        {
          label: t('menu.about'),
          click: showWikiInfo,
        },
      ],
    },
  ];
}

// 修改 createWindow 函数中的菜单创建部分
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: iconPath,
    skipTaskbar: true, // 添加此行以隐藏任务栏图标
    // frame: false,
    // titleBarStyle: 'hidden',
    // titleBarOverlay: {
    //   color: 'transparent',
    //   symbolColor: 'transparent',
    //   height: 10,
    // },
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });
mainWindow.webContents.on('context-menu', (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
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
        }
      },
      {
        label: t('menu.reload'),
        role: 'reload',
      },
    ]);
    contextMenu.popup();
  });
  // 创建任务栏图标
  createTray();

  // 处理窗口最小化事件
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

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
  initWiki(wikiPath, isFirstTime);
  // 注入渲染脚本
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      const script = document.createElement('script');
      script.src = 'file://${path
        .join(__dirname, '..', 'renderer', 'render.js')
        .replace(/\\/g, '/')}';
      document.body.appendChild(script);
    `);
  });
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}
// 添加 openFolderDialog 函数定义
async function openFolderDialog() {
  const result = await dialog.showOpenDialog({
    title: t('dialog.selectWikiFolder'),
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    if (path.basename(selectedPath) === 'tiddlers') {
      dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
      return await openFolderDialog();
    }
    const newWikiPath = selectedPath;
    if (wikiPath === newWikiPath) {
      console.info(t('log.sameFolder'));
      return;
    }
    wikiPath = newWikiPath;
    config.set('wikiPath', wikiPath);
    await initWiki(wikiPath);
  }
}

// 添加 IPC 处理程序
ipcMain.handle('dialog:openWiki', openFolderDialog);
ipcMain.handle('wiki:build', buildWiki);
ipcMain.handle('wiki:openInBrowser', () => {
  if (currentServer && currentPort) {
    shell.openExternal(`http://localhost:${currentPort}`);
  }
});
ipcMain.handle('wiki:getInfo', () => {
  return {
    wikiPath,
    port: currentPort,
  };
});

// 修改 initApp 函数
const initApp = async () => {
// 单实例
// const gotTheLock = app.requestSingleInstanceLock();

//   if (!gotTheLock) {
//     app.quit();
//     return;
//   }
  config = new Config({
    defaults: {
      wikiPath: DEFAULT_WIKI_DIR,
      language: 'zh-CN',
    },
  });
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

// 将原来的立即执行函数替换为初始化调用
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
