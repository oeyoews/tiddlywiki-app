import fs from 'fs';
import path from 'path';
import { app, shell, Menu, dialog, Tray, BrowserWindow } from 'electron';
import { t, i18next } from '@/i18n/index';

const { default: getPorts } = require('get-port');
const { TiddlyWiki } = require('tiddlywiki');
import { config } from '@/utils/config';
import { isEmptyDirectory } from '@/utils/checkEmptyDir';

const WIKIINFOFILE = 'tiddlywiki.info';
const DEFAULT_PORT = 8080;
const DEFAULT_WIKI_DIR = path.resolve('wiki'); // use app.getPath('desktop')

import packageInfo from '../../package.json';
import saveToGitHub from '@/utils/github-saver';
import {
  buildIndexHTMLArgs,
  wikiBuildArgs,
  wikiInitArgs,
  wikiStartupArgs,
} from '@/utils/wiki';
import { createMenubar } from './menubar';
import { log } from '@/utils/logger';
import { createTray } from './createTray';

let wikiInstances: { [port: number]: string } = {}; // 用于记录 port: wikipath, 便于端口复用

let win: BrowserWindow; // 在 initwiki 初始化时赋值

// NOTE： 这里使用使用对象引用, 便于更新值
export const server = {
  currentPort: DEFAULT_PORT,
  currentServer: null,
  menu: {} as Menu,
  tray: null as any as Tray,
};

const deps = {
  initWiki,
  openWiki,
  buildWiki,
  importSingleFileWiki,
  releaseWiki,
  configureGitHub,
  switchLanguage,
  showWikiInfo2,
  createNewWiki,
  toggleAutocorrect,
  toggleChineseLang,
  toggleMarkdown,
};

export const createMenuTemplate = createMenubar(config, deps, server);

// 添加更新最近打开的 wiki 列表的函数
function updateRecentWikis(wikiPath: string) {
  const recentWikis = config.get('recentWikis') || [];
  // 移除当前路径和已存在的相同路径
  const filteredWikis = recentWikis.filter(
    (path: string) => path !== wikiPath && path !== config.get('wikiPath')
  );
  filteredWikis.unshift(wikiPath);
  config.set('recentWikis', filteredWikis.slice(0, 5));

  // 更新菜单
  server.menu = Menu.buildFromTemplate(createMenuTemplate(win) as any);
  Menu.setApplicationMenu(server.menu);
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
    win,
  });
}

export async function initWiki(
  wikiFolder: string,
  isFirstTime: Boolean = false,
  _mainWindow?: BrowserWindow
) {
  log.info('begin initwiki');
  if (_mainWindow && !win) {
    win = _mainWindow;
  }
  try {
    // 检查当前实例的文件夹是否被初始化过
    const existingPort = Object.entries(wikiInstances).find(
      ([_, path]) => path === wikiFolder
    )?.[0];

    // 新实例：记录端口和路径
    if (!existingPort) {
      server.currentPort = await getPorts({ port: DEFAULT_PORT });
      log.info('start new server on', server.currentPort);
      wikiInstances[server.currentPort] = wikiFolder;
    } else {
      server.currentPort = Number(existingPort); // 更新端口
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
          // @ts-ignore
          return await initWiki(wikiFolder, true);
        }
        wikiFolder = selectedPath;
        config.set('wikiPath', selectedPath);
      }
    }

    const bootPath = path.join(wikiFolder, WIKIINFOFILE);

    if (!fs.existsSync(bootPath)) {
      const { boot } = TiddlyWiki();
      if (!isEmptyDirectory(wikiFolder)) {
        wikiFolder = DEFAULT_WIKI_DIR;
        if (!isFirstTime) {
          return;
        }
      }
      boot.argv = wikiInitArgs(wikiFolder);
      await boot.boot(() => {
        console.log(t('log.startInit'));
      });
      console.log(t('log.finishInit'));
    }

    if (server.currentServer) {
      server.currentServer = null;
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
    twBoot.argv = wikiStartupArgs(wikiFolder, server.currentPort);

    const startServer = (port: number) => {
      log.info(`start begin: http://localhost:${server.currentPort}`);
      win.loadURL(`http://localhost:${port}`);
      win.webContents.once('did-finish-load', () => {
        // 获取页面标题并设置窗口标题
        const pageTitle = win.webContents.getTitle();
        win.setTitle(`${pageTitle} - ${wikiFolder}`);
      });
    };
    server.currentServer = twBoot;
    if (!existingPort) {
      twBoot.boot(startServer(server.currentPort));
    } else {
      // 直接加载已存在的服务器
      startServer(server.currentPort);
    }
    updateRecentWikis(wikiFolder);
    return { port: server.currentPort };
  } catch (err) {
    dialog.showErrorBox(
      t('dialog.error'),
      // @ts-ignore
      t('dialog.initError', { message: err?.message })
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
    const res = await initWiki(selectedPath);
    return res;
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
    const bootPath = path.join(selectedPath, WIKIINFOFILE);
    if (!fs.existsSync(bootPath)) {
      dialog.showErrorBox(t('dialog.error'), t('dialog.noTiddlyWikiInfo'));
      return await openWiki();
    }

    if (config.get('wikiPath') === selectedPath) {
      console.info(t('log.sameFolder'));
      return;
    }
    config.set('wikiPath', selectedPath);
    const res = await initWiki(selectedPath);
    return res;
  }
}

export async function showWikiInfo() {
  dialog.showMessageBox({
    type: 'none',
    title: t('app.about'),
    message: t('app.name'),
    detail: `${t('app.version')}: ${packageInfo.version}\n${t(
      'app.currentWikiPath'
    )}：${config.get('wikiPath')}\n${t('app.runningPort')}：${
      server.currentPort || t('app.notRunning')
    }\n${t('app.configPath')}：${config.fileName}`,
    // width: 400,
    // height: 300,
    buttons: [t('dialog.close')],
    defaultId: 0,
    noLink: true,
  });
}

async function showWikiInfo2() {
  win.webContents.send('show-wiki-info', {
    appName: t('app.name'),
    version: packageInfo.version,
    wikiPath: config.get('wikiPath'),
    port: server.currentPort || t('app.notRunning'),
    configPath: config.fileName,
    closeText: t('dialog.close'),
  });
}

async function switchLanguage(lang: string) {
  config.set('language', lang);
  await i18next.changeLanguage(lang);

  // 更新菜单
  server.menu = Menu.buildFromTemplate(createMenuTemplate(win) as any);
  Menu.setApplicationMenu(server.menu);

  // 更新托盘菜单
  createTray(win, server);
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
        if (wikiRes?.port) {
          server.currentPort = wikiRes.port;
        }

        dialog.showMessageBox({
          type: 'info',
          title: t('dialog.importSuccess'),
          message: t('dialog.importSuccessMessage'),
        });
      }
    }
  } catch (err: any) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.importError', { message: err.message })
    );
  }
}

async function buildWiki() {
  try {
    const wikiPath = config.get('wikiPath');
    const bootPath = path.join(wikiPath, WIKIINFOFILE);
    let twInfo = JSON.parse(fs.readFileSync(bootPath, 'utf8'));

    // 检查并添加构建配置，修复导入的文件夹无法构建
    if (!twInfo.build || !twInfo.build.index) {
      twInfo.build = {
        ...twInfo.build,
        index: buildIndexHTMLArgs,
      };
      fs.writeFileSync(bootPath, JSON.stringify(twInfo, null, 4), 'utf8');
    }

    // 设置进度条
    win.setProgressBar(0.1);

    const { boot } = TiddlyWiki();
    boot.argv = wikiBuildArgs(wikiPath);

    // 更新进度条
    win.setProgressBar(0.4);

    await boot.boot(() => {
      win.setProgressBar(0.7);
      log.log(t('log.startBuild'));
    });

    // 构建完成
    win.setProgressBar(1);
    setTimeout(() => win.setProgressBar(-1), 1000); // 1 秒后移除进度条

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
  } catch (err: any) {
    win.setProgressBar(-1); // 出错时移除进度条
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
    win.webContents.send('config-github');
  }
}

async function toggleMarkdown(
  enable: Boolean,
  options = {
    notify: true,
  }
) {
  try {
    const wikiPath = config.get('wikiPath');
    const bootPath = path.join(wikiPath, WIKIINFOFILE);
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
        (plugin: any) => plugin !== markdownPlugin
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

async function toggleAutocorrect(menuItem: any) {
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
  enable: Boolean,
  options = {
    notify: true,
  }
) {
  try {
    const wikiPath = config.get('wikiPath');
    const bootPath = path.join(wikiPath, WIKIINFOFILE);
    let twInfo = JSON.parse(fs.readFileSync(bootPath, 'utf8'));

    if (!twInfo.languages) {
      twInfo.languages = [];
    }

    const langPlugin = 'zh-Hans';
    const hasChineseLang = twInfo.languages.includes(langPlugin);

    if (enable && !hasChineseLang) {
      twInfo.languages.push(langPlugin);
    } else if (!enable && hasChineseLang) {
      twInfo.languages = twInfo.languages.filter(
        (lang: string) => lang !== langPlugin
      );
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
