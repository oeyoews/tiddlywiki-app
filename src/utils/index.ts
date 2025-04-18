import fs from 'fs';
import fs2 from 'fs-extra';
import path from 'path';

import {
  app,
  shell,
  Menu,
  dialog,
  Tray,
  BrowserWindow,
  Notification,
  clipboard,
} from 'electron';
import { i18next } from '@/i18n/index';
import twinfo from '@/utils/tiddlywiki.json';

const { default: getPorts } = require('get-port');
// const { TiddlyWiki } = require('tiddlywiki');
import { config } from '@/utils/config';
import { isEmptyDirectory } from '@/utils/checkEmptyDir';

const WIKIINFOFILE = 'tiddlywiki.info';
// const DEFAULT_PORT = generateRandomPrivatePort();
const DEFAULT_PORT = config.get('defaultPort') || '8099';

export interface TwServerInfo {
  server?: Server | null;
  path: string;
  port?: number | null;
}

// let importIngNotify: Notification;
// let successImportNotify: Notification;

import {
  wikiBuildArgs,
  wikiInitArgs,
  wikiStartupArgs,
} from '@/utils/wiki/constant';
import { createMenubar } from '@/utils/menubar';
import { log } from '@/utils/logger';
import { getAppIcon, getMenuIcon } from '@/utils/icon';
import {
  checkBuildInfo,
  checkThemes,
  checkTWPlugins,
  updateOriginalPath,
} from '@/utils/wiki/index';
import { getFileSizeInMB } from './getFileSize';
import { IWikiTemplate } from './wikiTemplates';
import { createSymlink } from './subwiki';
import { t } from 'i18next';
import { ITiddlyWiki, type Server } from 'tiddlywiki';
import { tiddlywiki } from './tiddlywiki';
import { generateId } from './generateId';
import { showInputBox } from '@/modules/showInputBox';

let win: BrowserWindow; // 在 initwiki 初始化时赋值
const desktopDir = app.getPath('desktop');

// NOTE： 这里使用使用对象引用, 便于更新值
export const server = {
  currentPort: DEFAULT_PORT,
  // currentServer: null as any as Server,
  // | null,
  menu: {} as Menu,
  tray: null as any as Tray,
  win: null as any as BrowserWindow,
  downloadNotify: {} as Notification,
  // 维护一组tiddlywiki 实例
  twServers: new Map<string, TwServerInfo>(),
};

// TODO: cbl 等待一分钟 空白wiki？？？
export const closeTwServer = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const instance = server.twServers.get(id);
    if (instance?.server) {
      log.info('Begin close server', instance.path);
      instance.server.close((err: any) => {
        if (err) {
          log.error('Error closing server:', err);
          return reject(err);
        }
        // server.twServers.delete(id); // 移除
        // NOTE: 需要保存 path
        instance.port = null;
        instance.server = null;
        log.info('Close tiddlywiki server', instance.path);
        // dialog.showMessageBox({
        //   icon: getMenuIcon('success', 256),
        //   title: t('dialog.success'),
        //   message: t('dialog.closeSuccess', { path: instance.path }),
        // });
        resolve();
      });
    } else {
      reject(new Error('Server instance not found or already closed.'));
    }
  });
};

export type IConfig = typeof config;

export const createMenuTemplate = createMenubar(config);

// 添加更新最近打开的 wiki 列表的函数
function updateRecentWikis(wikiPath: string) {
  const recentWikis = config.get('recentWikis') || [];
  // 移除当前路径和已存在的相同路径
  const filteredWikis: string[] = recentWikis.filter(
    (path: string) => path !== wikiPath && path !== config.get('wikiPath')
  );
  filteredWikis.unshift(wikiPath);
  config.set('recentWikis', filteredWikis.slice(0, 15));

  // 更新菜单
  server.menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(server.menu);
}

export async function publishWiki() {
  // check has token
  const token = config.get('github')?.token;
  if (!token) {
    const res = await showInputBox(win, 'GitHub Token', 'password');
    if (res && typeof res === 'string') {
      config.set('github', {
        token: res,
      });
      win.webContents.send('get-gh-config');
    }
    // update tw-github-password localstorage
  } else {
    win.webContents.send('get-gh-config');
  }
}

export async function initWiki(
  wikiFolder: string,
  // isFirstTime: boolean = false, // 用于手动新建 wiki
  _mainWindow?: BrowserWindow
) {
  log.info('Begin initwiki', wikiFolder);
  // TODO: check wikifodler in admin
  if (_mainWindow && !win) {
    win = _mainWindow;
    server.win = _mainWindow;

    // 初始化notification
    // importIngNotify = new Notification({
    //   title: t('dialog.convertIng'),
    //   // body: t('dialog.convertIng'),
    //   icon: getAppIcon(256),
    //   silent: true,
    //   timeoutType: 'never',
    // });
    // successImportNotify = new Notification({
    //   title: t('dialog.importSuccess'),
    //   body: t('dialog.importSuccessMessage'),
    //   icon: getAppIcon(256),
    //   silent: false,
    // });
    server.downloadNotify = new Notification({
      title: t('dialog.templateDownloading'),
      icon: getAppIcon(256),
      timeoutType: 'never',
      silent: true,
    });
  }
  if (!win) {
    log.error('_mainWindow not founded');
  }
  try {
    const wikiFolderId = generateId(wikiFolder);
    const wikiServer = server.twServers.get(wikiFolderId);

    // 新实例：记录端口
    if (!wikiServer?.port) {
      const currentPort = await getPorts({
        port: [DEFAULT_PORT, 8081, 8082, 8083],
      });
      server.currentPort = currentPort;
    } else {
      server.currentPort = wikiServer.port; // 更新端口
    }

    // if (isFirstTime) {
    //   const result = await dialog.showOpenDialog({
    //     title: t('dialog.selectWikiFolder'),
    //     properties: ['openDirectory'],
    //     message: t('dialog.selectWikiFolderMessage'),
    //   });

    //   if (!result.canceled && result.filePaths.length > 0) {
    //     const selectedPath = result.filePaths[0];
    //     if (path.basename(selectedPath) === 'tiddlers') {
    //       dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
    //       return await initWiki(wikiFolder, true);
    //     }
    //     wikiFolder = selectedPath;
    //     config.set('wikiPath', selectedPath);
    //   }
    // }

    const bootPath = path.join(wikiFolder, WIKIINFOFILE);

    // 空目录就自动生成(wiki 目录文件被手动删除的情况和手动进行初始化)
    if (isEmptyDirectory(wikiFolder)) {
      // 空目录进行初始化
      tiddlywiki(wikiInitArgs(wikiFolder));
      log.info(wikiFolder, 'is empty, try init wiki');
    } else if (!isEmptyDirectory(wikiFolder) && !fs.existsSync(bootPath)) {
      // wiki目录存在但是 tiddlywiki.info 文件不存在, 直接写入tiddlywiki.info 文件
      fs.writeFileSync(bootPath, JSON.stringify(twinfo, null, 4), 'utf8');
    }

    await createSymlink(
      path.join(wikiFolder, 'subwiki'),
      path.join(wikiFolder, 'tiddlers/subwiki')
    );

    if (fs.existsSync(bootPath)) {
      checkTWPlugins(bootPath);
      updateOriginalPath(bootPath);
      checkThemes(bootPath);
    }

    // 启动实例前的检查
    toggleMarkdown(!!config.get('markdown'), {
      notify: false,
    });

    toggleChineseLang(!!config.get('lang-CN'), {
      notify: false,
    });

    const startServer = (port: number | string) => {
      if (!win) {
        log.error('mainwindow not founded on start server');
      }
      win.loadURL(`http://localhost:${port}`);
    };

    // server.currentServer = twBoot;
    if (!wikiServer?.port) {
      // prevent tiddlywiki ctrl+s
      const saveTiddler = [
        {
          title: '$:/config/shortcuts/save-wiki',
          text: '',
        },
      ];

      // @see: https://github.com/TiddlyWiki/TiddlyWiki5/blob/961e74f73d230d0028efb586db07699120eac888/editions/dev/tiddlers/new/Hook__th-server-command-post-start.tid#L4
      // @see: https://github.com/tiddly-gittly/plugin-dev-cli/blob/main/src/dev.ts#L65
      const createNewTw = () => {
        log.info('Start new server on port:', server.currentPort);
        // 新建tw实例
        tiddlywiki(
          wikiStartupArgs(wikiFolder, server.currentPort),
          saveTiddler,
          ($tw: ITiddlyWiki) => {
            // if (!firstRun) return;
            $tw.hooks.addHook(
              'th-server-command-post-start',
              (_listenCommand, newTwServer) => {
                // setTimeout(() => {
                //   console.log('begin close', new Date());
                //   newTwServer.close(() => {
                //     console.log('close successfully');
                //   });
                // }, 8000);
                const twId = generateId(wikiFolder);
                // 更新 twservers
                if (!server.twServers.get(twId)?.port) {
                  server.twServers.set(twId, {
                    path: wikiFolder,
                    server: newTwServer,
                    // @ts-ignore
                    port: server.currentPort,
                  });
                }
              }
            );
          }
        );
        // return twBoot;
      };

      log.log('starting, please wait a moment...', wikiFolder);

      createNewTw();
      startServer(server.currentPort);
    } else {
      // 直接加载已存在的服务器
      startServer(server.currentPort);
      log.info('open exist wiki', wikiServer.port, wikiFolder);
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

export async function createNewWiki() {
  const result = await dialog.showOpenDialog({
    title: t('dialog.selectNewWikiFolder'),
    defaultPath: path.join(desktopDir),
    properties: ['openDirectory'],
    message: t('dialog.selectNewWikiFolderMessage'),
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    if (path.basename(selectedPath) === 'tiddlers') {
      dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
      return;
      // return await createNewWiki();
    }

    // 检查文件夹是否为空
    if (!isEmptyDirectory(selectedPath)) {
      dialog.showErrorBox(t('dialog.error'), t('dialog.folderNotEmpty'));
      return;
    }

    config.set('wikiPath', selectedPath);
    const res = await initWiki(selectedPath);
    return res;
  }
}

export async function openWiki() {
  const result = await dialog.showOpenDialog({
    title: t('dialog.selectWikiFolder'),
    properties: ['openDirectory'],
    defaultPath: path.join(config.get('wikiPath'), '..'),
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    if (path.basename(selectedPath) === 'tiddlers') {
      dialog.showErrorBox(t('dialog.error'), t('dialog.invalidFolderName'));
      return;
      // return await openWiki();
    }

    // 检查是否存在 tiddlywiki.info 文件
    const bootPath = path.join(selectedPath, WIKIINFOFILE);
    if (!fs.existsSync(bootPath)) {
      dialog.showErrorBox(t('dialog.error'), t('dialog.noTiddlyWikiInfo'));
      // return await openWiki();
      return;
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
  const { version, name } = await import('../../package.json');
  const detail = `${t('app.version')}: ${version}\n${t(
    'app.currentWikiPath'
  )}：${config.get('wikiPath')}\n${t('app.runningPort')}：${
    server.currentPort || t('app.notRunning')
  }\n${t('app.configPath')}：${config.fileName}`;
  const res = await dialog.showMessageBox({
    type: 'none',
    title: t('app.about'),
    message: t('app.name'),
    icon: getMenuIcon('about', 256),
    detail,
    // width: 400,
    // height: 300,
    buttons: [t('dialog.copy'), t('dialog.close')],
    defaultId: 0,
    cancelId: 1,
    // noLink: true,
  });
  if (res.response === 0) {
    clipboard.writeText(detail);
  }
}

export async function switchLanguage(lang: string) {
  config.set('language', lang);
  await i18next.changeLanguage(lang);

  // 更新菜单
  server.menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(server.menu);
  log.info('switch lang to', lang);

  // 更新托盘菜单
  import('@/utils/createTray').then(({ createTray }) =>
    createTray(win, server)
  );
}

export async function importSingleFileWiki(
  html?: string,
  template?: IWikiTemplate
) {
  try {
    let htmlPath = html;
    if (html) {
      log.info(html, 'import wiki use template');
    }

    if (!htmlPath) {
      log.info('create new wiki');
      const result = await dialog.showOpenDialog({
        title: t('dialog.selectHtmlFile'),
        filters: [
          { name: t('dialog.htmlFilter'), extensions: ['html', 'htm'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        return;
      }
      htmlPath = result.filePaths[0];
    }

    const targetFolder = await dialog.showOpenDialog({
      title: t('dialog.selectImportFolder'),
      properties: ['openDirectory'],
      message: t('dialog.selectImportFolderMessage'),
    });

    if (targetFolder.canceled || targetFolder.filePaths.length === 0) {
      return;
    }

    const targetPath = targetFolder.filePaths[0];
    // 不直接判断路径和当前wiki 一致， 只要为空即可
    if (!isEmptyDirectory(targetPath)) {
      dialog.showErrorBox(t('dialog.error'), t('dialog.folderNotEmpty'));
      return;
    }

    // 复制文件夹
    if (template) {
      const templateDir = path.join(app.getPath('temp'), template as any);
      log.info('Begin copy file to', templateDir);
      await fs2.copy(templateDir, targetPath);
      log.info('copy file done', templateDir);
    } else {
      // html2folder 手动转换
      const loadArgs = [
        '--load',
        htmlPath,
        '--savewikifolder',
        targetPath,
        // '--verbose',
      ];
      tiddlywiki(loadArgs);
      log.log('import file successfully', htmlPath, loadArgs);
      // 尝试创建files软连接
      if (!html) {
        const htmlDir = path.dirname(htmlPath);
        const filesDir = path.join(htmlDir, 'files');
        const targetFolderFile = path.join(targetPath, 'files');
        // 检测是否已经存在files文件夹
        if (fs.existsSync(filesDir) && !fs.existsSync(targetFolderFile)) {
          await createSymlink(filesDir, targetFolderFile);
          log.info('create file symlink', filesDir, targetFolderFile);
        }
      }
    }
    // 避免启动大的wiki导致卡顿， 需要重启
    win.webContents.send('wiki-imported');
    // TODO: 移除提示， 直接强制重启
    await restartDialog(
      t('dialog.importSuccessMessage'),
      t('dialog.importSuccess'),
      () => {
        config.set('wikiPath', targetPath);
      }
    );
    // successImportNotify.show()
    // restartDialog("")
    // const wikiRes = await initWiki(targetPath);
    // setTimeout(() => {
    //   importIngNotify.close();
    // }, 800);
    // if (wikiRes?.port) {
    //   server.currentPort = wikiRes.port;
    // }
    // setTimeout(() => {
    //   successImportNotify.show();
    // }, 1000);
  } catch (err: any) {
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.importError', { message: err.message })
    );
  }
}

export async function buildWiki({ password }: IBuildOptions) {
  try {
    const wikiPath = config.get('wikiPath');
    checkBuildInfo(wikiPath);
    log.log(t('log.startBuild'));
    // 设置进度条
    win.setProgressBar(0.1);

    tiddlywiki(wikiBuildArgs(wikiPath, password));

    // 构建完成
    win.setProgressBar(1);

    const filesDir = path.join(wikiPath, 'files');
    const targetFolderFile = path.join(wikiPath, 'output', 'files');
    // 尝试创建files软连接
    // 检测是否已经存在files文件夹
    if (fs.existsSync(filesDir) && !fs.existsSync(targetFolderFile)) {
      await createSymlink(filesDir, targetFolderFile);
      log.info('create file symlink(build)', filesDir, targetFolderFile);
    }

    setTimeout(() => win.setProgressBar(-1), 1000); // 1 秒后移除进度条

    const outputPath = path.join(wikiPath, 'output', 'index.html');
    // 统计当前index.html 文件大小
    const indexHTMLSize = getFileSizeInMB(outputPath);

    const result = await dialog.showMessageBox({
      type: 'info',
      title: t('dialog.buildComplete'),
      message: t('dialog.buildCompleteMessage', { size: indexHTMLSize }),
      icon: getMenuIcon('about', 256),
      buttons: [
        t('dialog.preview'),
        t('dialog.showInFolder'),
        t('menu.publish'),
        t('dialog.saveAs'),
        t('dialog.close'),
      ],
      defaultId: 0,
      cancelId: 4,
    });

    switch (result.response) {
      case 0:
        shell.openExternal(`file://${outputPath}`);
        break;
      case 1:
        shell.showItemInFolder(outputPath);
        break;
      case 2:
        await publishWiki();
        break;
      case 3:
        const { filePath } = await dialog.showSaveDialog({
          title: t('dialog.saveAs'),
          defaultPath: path.join(desktopDir, Date.now() + '-index.html'),
          filters: [{ name: 'HTML', extensions: ['html'] }],
        });

        if (filePath) {
          try {
            await fs.promises.copyFile(outputPath, filePath);
            dialog.showMessageBox({
              type: 'info',
              title: t('dialog.saveAsSuccess'),
              message: `${t('dialog.saveAsSuccess')}: ${filePath}`,
              buttons: [t('dialog.confirm')],
            });
          } catch (error: any) {
            // log.log('保存失败: ' + error.message);
            // dialog.showErrorBox('保存失败', '无法保存文件: ' + error.message);
          }
        }
        break;
      default:
        break;
    }
  } catch (err: any) {
    win.setProgressBar(-1); // 出错时移除进度条
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.buildError', { message: err.message })
    );
  }
}

export async function restartDialog(
  title = t('settings.settingChanged'),
  message = t('settings.restartTips'),
  cbl?: Function
) {
  const result = await dialog.showMessageBox({
    type: 'info',
    title,
    icon: getMenuIcon('about', 256),
    message,
    buttons: [t('dialog.restartNow'), t('dialog.later')],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 0) {
    if (typeof cbl === 'function') {
      cbl();
    }
    log.info('restart');
    app.relaunch();
    app.exit(0);
  }
}

export async function toggleIcon(enable: Boolean) {
  config.set('icon', enable);
  log.info('toggle men icon', enable);
  server.menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(server.menu);
  restartDialog();
}

// export async function toggleEnableBeta(enable: Boolean) {
//   config.set('betaChannel', enable);
//   log.info('enable betaChannel', enable);
// }

export async function toggleMarkdown(
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
    restartDialog();
  } catch (err) {}
}

export async function toggleAutocorrect(menuItem: any) {
  if (menuItem.checked) {
    const res = await dialog.showMessageBox({
      type: 'info',
      title: t('dialog.enableAutocorrect'),
      icon: getMenuIcon('warning', 256),
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

  restartDialog();
}

export async function toggleChineseLang(
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
    restartDialog();
  } catch (err) {}
}
