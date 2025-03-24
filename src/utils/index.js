const fs = require('fs');
const path = require('path');
const { app, shell, Menu, dialog, Tray } = require('electron');
import { i18next } from '@/i18n/index.js';
const { t } = i18next;
const DEFAULT_PORT = 8080;
const DEFAULT_WIKI_DIR = path.resolve('wiki'); // use app.getPath('desktop')
const { default: getPorts } = require('get-port');
const { TiddlyWiki } = require('tiddlywiki');
const { autoUpdater } = require('electron-updater');
let tray = null;
let menu = null;
import { config } from '@/utils/config';
import { updaterConfig } from '@/utils/updater.js';
import { iconPath, iconPathDev } from '@/utils/icon';

import packageInfo from '../../package.json';
import saveToGitHub from './github-saver';
let updateAvailableHandled = false;
let downloadFinished = false;
let hasLatestNotify = false;
let wikiInstances = {}; // 用于记录 port: wikipath, 便于端口复用

const log = require('electron-log/main');

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
  filteredWikis.unshift(wikiPath);
  config.set('recentWikis', filteredWikis.slice(0, 5));

  // 更新菜单
  menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

async function releaseWiki() {
  const wikiFolder = config.get('wikiPath');
  const { repo, owner, token, branch } = config.get('github');
  await saveToGitHub({
    wikiFolder,
    owner,
    repo,
    GITHUB_TOKEN: token,
    branch,
    mainWindow,
  });
}

async function initWiki(wikiFolder, isFirstTime = false, _mainWindow) {
  if (_mainWindow) {
    mainWindow = _mainWindow;
  }
  try {
    // 检查当前实例的文件夹是否被初始化过
    const existingPort = Object.entries(wikiInstances).find(
      ([_, path]) => path === wikiFolder
    )?.[0];

    // 新实例：记录端口和路径
    if (!existingPort) {
      currentPort = await getPorts({ port: DEFAULT_PORT });
      log.info('start new server on ', currentPort);
      wikiInstances[currentPort] = wikiFolder;
    } else {
      currentPort = existingPort; // 更新端口
    }

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

    // 启动实例前的检查
    if (config.get('markdown')) {
      toggleMarkdown(true, {
        notify: false,
      });
    }
    if (config.get('lang-CN')) {
      toggleChineseLang(true, {
        notify: false,
      });
    }

    const { boot: twBoot } = TiddlyWiki();
    twBoot.argv = [
      wikiFolder,
      '--listen',
      `port=${currentPort}`,
      // 'host=0.0.0.0',
      'root-tiddler=$:/core/save/all-external-js',
    ];

    const startServer = (port) => {
      log.info(`start begin: http://localhost:${currentPort}`);
      mainWindow.loadURL(`http://localhost:${port}`);
      mainWindow.webContents.once('did-finish-load', () => {
        // 获取页面标题并设置窗口标题
        const pageTitle = mainWindow.webContents.getTitle();
        mainWindow.setTitle(`${pageTitle} - ${wikiFolder}`);
      });
    };
    currentServer = twBoot;
    if (!existingPort) {
      twBoot.boot(startServer(currentPort));
    } else {
      // 直接加载已存在的服务器
      startServer(currentPort);
    }
    updateRecentWikis(wikiFolder);
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
    tray = new Tray(app.isPackaged ? iconPath : iconPathDev);
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
  dialog.showMessageBox({
    type: 'none',
    title: t('app.about'),
    message: t('app.name'),
    detail: `${t('app.version')}: ${packageInfo.version}\n${t(
      'app.currentWikiPath'
    )}：${config.get('wikiPath')}\n${t('app.runningPort')}：${
      currentPort || t('app.notRunning')
    }\n${t('app.configPath')}：${config.fileName}`,
    width: 400,
    height: 300,
    buttons: [t('dialog.close')],
    defaultId: 0,
    noLink: true,
  });
}

async function showWikiInfo2() {
  mainWindow.webContents.send('show-wiki-info', {
    appName: t('app.name'),
    version: packageInfo.version,
    wikiPath: config.get('wikiPath'),
    port: currentPort || t('app.notRunning'),
    configPath: config.fileName,
    closeText: t('dialog.close'),
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
                const updatemenu = menu.items
                  .find((item) => item.label === t('menu.file'))
                  .submenu.items.find(
                    (item) => item.label === t('menu.recentWikis')
                  );
                // updatemenu.submenu.items = null;
                // updatemenu.label = updatemenu.label + ' (0)';
                updatemenu.enabled = false;
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
          label: t('menu.publish'),
          submenu: [
            {
              label: t('menu.publishToGitHub'),
              click: releaseWiki,
            },
          ],
        },
        {
          label: t('menu.buildWiki'),
          click: buildWiki,
        },
        { type: 'separator' },
        {
          label: t('menu.restart'),
          accelerator: 'CmdOrCtrl+Shift+Alt+R',
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
          role: 'reload',
          label: t('menu.reload'),
        },
        {
          role: 'forceReload',
          label: t('menu.forceReload'),
        },
        { type: 'separator' },
        {
          role: 'resetZoom',
          label: t('menu.resetZoom'),
        },
        {
          role: 'zoomIn',
          label: t('menu.zoomIn'),
          accelerator: 'CmdOrCtrl+=',
        },
        {
          role: 'zoomOut',
          label: t('menu.zoomOut'),
        },
        { type: 'separator' },
        {
          role: 'togglefullscreen',
          label: t('menu.toggleFullscreen'),
          accelerator: 'F11',
        },
        {
          label: t('menu.toggleMenuBar'),
          accelerator: 'Alt+M',
          click: () => {
            const isVisible = mainWindow.isMenuBarVisible();
            mainWindow.setMenuBarVisibility(!isVisible);
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
            shell.openPath(config.get('wikiPath'));
          },
        },
      ],
    },
    {
      label: t('menu.settings'),
      submenu: [
        {
          label: t('menu.markdown'),
          type: 'checkbox',
          checked: config.get('markdown'),
          click: (menuItem) => toggleMarkdown(menuItem.checked),
        },
        {
          label: t('menu.autocorrect'),
          type: 'checkbox',
          checked: config.get('autocorrect'),
          click: async (menuItem) => await toggleAutocorrect(menuItem),
        },
        {
          label: t('menu.langCN'),
          type: 'checkbox',
          checked: config.get('lang-CN'),
          click: (menuItem) => toggleChineseLang(menuItem.checked),
        },
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
                    log.info(
                      'dev: test autoStart',
                      app.getLoginItemSettings().openAtLogin
                    );
                  } else {
                    log.info(
                      'before toggle autoStart',
                      app.getLoginItemSettings().openAtLogin
                    );
                    app.setLoginItemSettings({
                      openAtLogin: !app.getLoginItemSettings().openAtLogin,
                      path: process.execPath, // or use app.getPath('exe'),
                    });
                    log.info(
                      app.getLoginItemSettings().openAtLogin,
                      'after: autoStart toggled'
                    );
                  }
                },
              },
            ]
          : []),
        {
          label: t('menu.githubConfig'),
          click: configureGitHub,
        },
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
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.openDevTools({ mode: 'right' }),
        },
        {
          label: t('menu.checkUpdate'),
          click: checkForUpdates,
          enabled: !downloadFinished,
        },
        {
          label: t('menu.showLogs'),
          click: () => {
            shell.openPath(app.getPath('logs'));
          },
        },
        {
          label: t('menu.reportIssue'),
          click: () =>
            shell.openExternal(
              'https://github.com/oeyoews/tiddlywiki-app/issues'
            ),
        },
        {
          label: t('menu.twdocs'),
          click: () => {
            const isZH = i18next.language === 'zh-CN';
            shell.openExternal(
              isZH
                ? 'https://bramchen.github.io/tw5-docs/zh-Hans'
                : 'https://tiddlywiki.com/'
            );
          },
        },
        {
          label: t('menu.forum'),
          click: () => shell.openExternal('https://talk.tiddlywiki.org/'),
        },
        {
          label: t('menu.about'),
          click: showWikiInfo2,
        },
      ],
    },
  ];
}

async function switchLanguage(lang) {
  config.set('language', lang);
  await i18next.changeLanguage(lang);

  // 更新菜单
  menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);

  // 更新托盘菜单
  createTray(mainWindow);
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

    // 设置进度条
    mainWindow.setProgressBar(0.1);

    const { boot } = TiddlyWiki();
    boot.argv = [wikiPath, '--build', 'index'];

    // 更新进度条
    mainWindow.setProgressBar(0.4);

    await boot.boot(() => {
      mainWindow.setProgressBar(0.7);
      log.log(t('log.startBuild'));
    });

    // 构建完成
    mainWindow.setProgressBar(1);
    setTimeout(() => mainWindow.setProgressBar(-1), 1000); // 1 秒后移除进度条

    const outputPath = path.join(wikiPath, 'output', 'index.html');
    const result = await dialog.showMessageBox({
      type: 'info',
      title: t('dialog.buildComplete'),
      message: t('dialog.buildCompleteMessage'),
      buttons: [
        t('dialog.preview'),
        t('dialog.showInFolder'),
        t('menu.publish'),
        t('dialog.close'),
      ],
      defaultId: 0,
      cancelId: 2,
    });

    if (result.response === 0) {
      shell.openExternal(`file://${outputPath}`);
    } else if (result.response === 1) {
      shell.showItemInFolder(outputPath);
    } else if (result.response === 2) {
      await releaseWiki();
    }
  } catch (err) {
    mainWindow.setProgressBar(-1); // 出错时移除进度条
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.buildError', { message: err.message })
    );
  }
}

async function configureGitHub() {
  const currentConfig = config.get('github');
  const result = await dialog.showMessageBox({
    type: 'question',
    title: t('dialog.githubConfig'),
    message: t('dialog.githubConfigMessage'),
    detail:
      `Token: ${currentConfig.token ? '******' : t('dialog.notSet')}\n` +
      `Owner: ${currentConfig.owner || t('dialog.notSet')}\n` +
      `Repo: ${currentConfig.repo || t('dialog.notSet')}\n` +
      `Branch: ${currentConfig.branch}`,
    buttons: [t('dialog.modify'), t('dialog.close')],
    defaultId: 1,
    cancelId: 1,
  });
  if (result.response === 0) {
    mainWindow.webContents.send('config-github');
  }
}

async function toggleMarkdown(
  enable,
  options = {
    notify: true,
  }
) {
  try {
    const wikiPath = config.get('wikiPath');
    const bootPath = path.join(wikiPath, 'tiddlywiki.info');
    let twInfo = JSON.parse(fs.readFileSync(bootPath, 'utf8'));

    if (!twInfo.plugins) {
      twInfo.plugins = [];
    }

    const markdownPlugin = 'tiddlywiki/markdown';
    const hasMarkdown = twInfo.plugins.includes(markdownPlugin);

    if (enable && !hasMarkdown) {
      twInfo.plugins.push(markdownPlugin);
    } else if (!enable && hasMarkdown) {
      twInfo.plugins = twInfo.plugins.filter(
        (plugin) => plugin !== markdownPlugin
      );
    }

    fs.writeFileSync(bootPath, JSON.stringify(twInfo, null, 4), 'utf8');
    config.set('markdown', enable);
    if (!options.notify) {
      return;
    }

    const result = await dialog.showMessageBox({
      type: 'info',
      title: t('settings.settingChanged'),
      message: t('settings.restartTips'),
      buttons: [t('dialog.restartNow'), t('dialog.later')],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      app.relaunch();
      app.exit(0);
    }
  } catch (err) {}
}

async function toggleAutocorrect(menuItem) {
  if (menuItem.checked) {
    const res = await dialog.showMessageBox({
      type: 'info',
      title: t('dialog.enableAutocorrect'),
      message: t('dialog.autocorrect'),
      buttons: [t('dialog.confirm'), t('dialog.cancel')],
      defaultId: 0,
      cancelId: 1,
    });

    if (res.response !== 0) {
      log.info('cancel enable autocorrect');
      menuItem.checked = !menuItem.checked; // 取消时手动回退 checked
      return;
    } else {
      config.set('autocorrect', menuItem.checked);
      log.info('enable autocorrect');
    }
  } else {
    config.set('autocorrect', false);
  }

  const result = await dialog.showMessageBox({
    type: 'info',
    title: t('settings.settingChanged'),
    message: t('settings.restartTips'),
    buttons: [t('dialog.restartNow'), t('dialog.later')],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    app.relaunch();
    app.exit(0);
  }
}

async function toggleChineseLang(
  enable,
  options = {
    notify: true,
  }
) {
  try {
    const wikiPath = config.get('wikiPath');
    const bootPath = path.join(wikiPath, 'tiddlywiki.info');
    let twInfo = JSON.parse(fs.readFileSync(bootPath, 'utf8'));

    if (!twInfo.languages) {
      twInfo.languages = [];
    }

    const langPlugin = 'zh-Hans';
    const hasChineseLang = twInfo.languages.includes(langPlugin);

    if (enable && !hasChineseLang) {
      twInfo.languages.push(langPlugin);
    } else if (!enable && hasChineseLang) {
      twInfo.languages = twInfo.languages.filter((lang) => lang !== langPlugin);
    }

    fs.writeFileSync(bootPath, JSON.stringify(twInfo, null, 4), 'utf8');
    config.set('lang-CN', enable);
    if (!options.notify) {
      return;
    }

    const result = await dialog.showMessageBox({
      type: 'info',
      title: t('settings.settingChanged'),
      message: t('settings.restartTips'),
      buttons: [t('dialog.restartNow'), t('dialog.later')],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      app.relaunch();
      app.exit(0);
    }
  } catch (err) {}
}

export {
  config,
  isEmptyDirectory,
  openWiki,
  initWiki,
  createNewWiki,
  showWikiInfo,
  createTray,
  createMenuTemplate,
};

async function checkForUpdates() {
  try {
    // 模拟打包环境
    // if (!app.isPackaged) {
    //   Object.defineProperty(app, 'isPackaged', {
    //     get: () => true,
    //   });
    // }

    // const checkMenu = menu.items
    //   .find((item) => item.label === t('menu.help'))
    //   .submenu.items.find((item) => item.label === t('menu.checkUpdate'));

    autoUpdater.setFeedURL(updaterConfig);

    autoUpdater.on('checking-for-update', () => {
      log.info('checking-for-update');
      mainWindow.setProgressBar(0.2);
      // checkMenu.label = t('dialog.updateChecking');
      // Menu.setApplicationMenu(menu);
    });

    autoUpdater.on('update-available', async (info) => {
      if (updateAvailableHandled) return; // 防止重复弹窗
      updateAvailableHandled = true;

      log.info('update available');
      // checkMenu.enabled = false;
      // Menu.setApplicationMenu(menu);

      const result = await dialog.showMessageBox({
        type: 'info',
        title: t('dialog.updateAvailable'),
        message: t('dialog.newVersion', { version: info.version }),
        // detail: t('dialog.downloading'),
        // buttons: ['confirm', 'cancel'],
        buttons: [t('dialog.confirm'), t('dialog.cancel')],
        defaultId: 0,
        cancelId: 1,
      });
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
      } else {
        log.info('update canceled');
      }
    });

    autoUpdater.on('update-not-available', () => {
      if (hasLatestNotify) return; // 防止重复弹窗
      hasLatestNotify = true;
      mainWindow.setProgressBar(-1);
      dialog.showMessageBox({
        type: 'info',
        title: t('dialog.updateCheck'),
        message: t('dialog.noUpdate'),
      });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info(progressObj.percent.toFixed(2) + '%', 'Updating');
      mainWindow.setProgressBar(progressObj.percent / 100);
    });

    autoUpdater.on('update-downloaded', async (info) => {
      if (downloadFinished) return; // 防止重复弹窗
      // checkMenu.label = t('menu.restart');
      // checkMenu.enabled = true;
      // Menu.setApplicationMenu(menu);
      log.info('update downloaded');

      downloadFinished = true;
      mainWindow.setProgressBar(-1);
      const result = await dialog.showMessageBox({
        type: 'info',
        title: t('dialog.updateReady'),
        message: t('dialog.updateReadyMessage', { version: info.version }),
        buttons: [t('dialog.restartNow'), t('dialog.later')],
        defaultId: 0,
        cancelId: 1,
      });

      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });

    autoUpdater.on('error', (err) => {
      mainWindow.setProgressBar(-1);
      dialog.showErrorBox(
        t('dialog.error'),
        t('dialog.updateError', { message: err.message })
      );
    });

    // 重置变量
    updateAvailableHandled = false;
    downloadFinished = false;
    hasLatestNotify = false;

    await autoUpdater.checkForUpdates();
  } catch (err) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.updateError', { message: err.message })
    );
  }
}
