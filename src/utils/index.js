const fs = require('fs');
const path = require('path');
const { app, shell, Menu, dialog, Tray } = require('electron');
const { i18next } = require('../i18n');
const { t } = i18next;
const { Conf: Config } = require('electron-conf');
const DEFAULT_PORT = 8080;
const DEFAULT_WIKI_DIR = path.resolve('wiki');
const { default: getPorts } = require('get-port');
const { TiddlyWiki } = require('tiddlywiki');
let tray = null;
const iconPath = path.join(__dirname, '..', 'assets', 'tray-icon.png');
const packageInfo = require('../../package.json');

const config = new Config({
  defaults: {
    wikiPath: DEFAULT_WIKI_DIR,
    language: 'zh-CN',
    recentWikis: [], // 添加最近打开的 wiki 列表
  },
});
let currentServer = null;
let mainWindow = null; // 在 initwiki 初始化时赋值
let currentPort = DEFAULT_PORT;

// 添加更新最近打开的 wiki 列表的函数
function updateRecentWikis(wikiPath) {
  const recentWikis = config.get('recentWikis') || [];
  // 移除当前路径和已存在的相同路径
  const filteredWikis = recentWikis.filter(
    (path) => path !== wikiPath && path !== config.get('wikiPath')
  );
  // 将新路径添加到开头
  filteredWikis.unshift(wikiPath);
  // 只保留最近的 5 个
  config.set('recentWikis', filteredWikis.slice(0, 5));
}

async function initWiki(wikiFolder, isFirstTime = false, _mainWindow) {
  if (_mainWindow) {
    mainWindow = _mainWindow;
  }
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
        wikiFolder = selectedPath;
        config.set('wikiPath', selectedPath);
      }
    }

    const bootPath = path.join(wikiFolder, 'tiddlywiki.info');

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
    updateRecentWikis(wikiFolder); // 添加这一行
    return { port: currentPort };
  } catch (err) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.initError', { message: err.message })
    );
  }
}

async function createNewWiki() {
  const result = await dialog.showOpenDialog({
    title: t('dialog.selectNewWikiFolder'),
    properties: ['openDirectory'],
    message: t('dialog.selectNewWikiFolderMessage'),
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    if (path.basename(selectedPath) === 'tiddlers') {
      dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
      return await createNewWiki();
    }

    // 检查文件夹是否为空
    if (!isEmptyDirectory(selectedPath)) {
      dialog.showErrorBox(t('dialog.error'), t('dialog.folderNotEmpty'));
      return await createNewWiki();
    }

    config.set('wikiPath', selectedPath);
    const { port } = await initWiki(selectedPath);
    return { port };
  }
}

async function openWiki() {
  const result = await dialog.showOpenDialog({
    title: t('dialog.selectWikiFolder'),
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    if (path.basename(selectedPath) === 'tiddlers') {
      dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
      return await openWiki();
    }

    // 检查是否存在 tiddlywiki.info 文件
    const bootPath = path.join(selectedPath, 'tiddlywiki.info');
    if (!fs.existsSync(bootPath)) {
      dialog.showErrorBox(t('dialog.error'), t('dialog.noTiddlyWikiInfo'));
      return await openWiki();
    }

    if (config.get('wikiPath') === selectedPath) {
      console.info(t('log.sameFolder'));
      return;
    }
    config.set('wikiPath', selectedPath);
    const { port } = await initWiki(selectedPath);
    return { port };
  }
}

// 检查目录是否为空
function isEmptyDirectory(directoryPath) {
  try {
    if (!fs.existsSync(directoryPath)) {
      return true;
    }
    const files = fs.readdirSync(directoryPath);
    return files.length === 0;
  } catch (err) {
    console.error('检查目录失败：', err);
    return false;
  }
}

// 修改 createTray 函数中的菜单项
function createTray(mainWindow) {
  if (!tray) {
    tray = new Tray(iconPath);
  }
  tray.setToolTip(t('tray.tooltip'));
  tray.setTitle(t('tray.tooltip'));
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
        if (currentPort) {
          shell.openExternal(`http://localhost:${currentPort}`);
        }
      },
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
  tray.on('click', () => {
    if (!mainWindow.isVisible() || mainWindow.isMinimized()) {
      mainWindow.show();
      mainWindow.restore();
    } else {
      mainWindow.minimize();
    }
  });
}

async function showWikiInfo() {
  const info = await dialog.showMessageBox({
    type: 'info',
    title: t('app.about'),
    message: t('app.name'),
    detail: `${t('app.version')}: ${packageInfo.version}\n${t(
      'app.currentWikiPath'
    )}：${config.get('wikiPath')}\n${t('app.runningPort')}：${
      currentPort || t('app.notRunning')
    }\n${t('app.configPath')}：${config.fileName}`,
  });
}

// 添加创建菜单模板的函数
function createMenuTemplate() {
  const recentWikis = (config.get('recentWikis') || []).filter(
    (path) => path !== config.get('wikiPath')
  );

  return [
    {
      label: t('menu.file'),
      submenu: [
        {
          label: t('menu.openExistingWiki'),
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { port } = await openWiki();
            currentPort = port;
          },
        },
        {
          label: t('menu.createNewWiki'),
          accelerator: 'CmdOrCtrl+N',
          click: async () => {
            const { port } = await createNewWiki();
            currentPort = port;
          },
        },
        { type: 'separator' },
        {
          label: t('menu.recentWikis'),
          submenu: [
            ...recentWikis.map((wikiPath) => ({
              label: wikiPath,
              click: async () => {
                config.set('wikiPath', wikiPath);
                const { port } = await initWiki(wikiPath);
                currentPort = port;
              },
            })),
            { type: 'separator' },
            {
              label: t('menu.clearRecentWikis'),
              enabled: recentWikis.length > 0,
              click: () => {
                config.set('recentWikis', []);
                const menu = Menu.buildFromTemplate(createMenuTemplate());
                Menu.setApplicationMenu(menu);
              },
            },
          ],
        },
        { type: 'separator' },
        {
          label: t('menu.importWiki'),
          click: importSingleFileWiki,
        },
        {
          label: t('menu.buildWiki'),
          click: buildWiki,
        },
        { type: 'separator' },
        {
          label: t('menu.restart'),
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            app.relaunch();
            app.exit(0);
          },
        },
        { type: 'separator' },
        {
          label: t('menu.exit'),
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    },
    {
      label: t('menu.view'),
      submenu: [
        {
          label: t('menu.toggleFullscreen'),
          accelerator: 'F11',
          click: () => {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
          },
        },
        {
          label: t('menu.toggleMenuBar'),
          accelerator: 'Alt+M',
          click: () => {
            const isVisible = mainWindow.isMenuBarVisible();
            mainWindow.setMenuBarVisibility(!isVisible);
            // mainWindow.setAutoHideMenuBar(menuBarVisible);
          },
        },
        {
          label: t('menu.openInBrowser'),
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (currentPort) {
              shell.openExternal(`http://localhost:${currentPort}`);
            }
          },
        },
        {
          label: t('menu.openFolder'),
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            shell.showItemInFolder(config.get('wikiPath'));
          },
        },
      ],
    },
    {
      label: t('menu.settings'),
      submenu: [
        ...(process.platform === 'win32' || process.platform === 'darwin'
          ? [
              {
                label: t('menu.autoStart'),
                type: 'checkbox',
                checked: app.getLoginItemSettings().openAtLogin,
                click() {
                  if (!app.isPackaged) {
                    app.setLoginItemSettings({
                      openAtLogin: !app.getLoginItemSettings().openAtLogin,
                      path: process.execPath, // or use app.getPath('exe'),
                    });
                  } else {
                    app.setLoginItemSettings({
                      openAtLogin: !app.getLoginItemSettings().openAtLogin,
                    });
                  }
                },
              },
            ]
          : []),
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
          label: t('menu.reportIssue'),
          click: () =>
            shell.openExternal(
              'https://github.com/oeyoews/tiddlywiki-app/issues'
            ),
        },
        {
          label: t('menu.about'),
          click: showWikiInfo,
        },
      ],
    },
  ];
}

async function switchLanguage(lang) {
  config.set('language', lang);
  await i18next.changeLanguage(lang);

  // 更新菜单
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);

  // 更新托盘菜单
  createTray(mainWindow);

  // 显示语言切换成功提示
  // dialog.showMessageBox({
  //   type: 'info',
  //   title: t('settings.languageChanged'),
  //   message: t('settings.restartTips'),
  // });
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
        config.set('wikiPath', targetPath);
        const wikiRes = await initWiki(targetPath);
        currentPort = wikiRes.port;

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

async function buildWiki() {
  try {
    const wikiPath = config.get('wikiPath');
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

module.exports = {
  isEmptyDirectory,
  config,
  openWiki,
  initWiki,
  createNewWiki,
  showWikiInfo,
  createTray,
  createMenuTemplate,
};
