import { t, i18next } from '@/i18n/index';
import {
  type MenuItemConstructorOptions,
  Menu,
  shell,
  app,
  type BrowserWindow,
  nativeImage,
  MenuItem,
} from 'electron';

import { log } from '@/utils/logger';

import { checkForUpdates } from '@/utils/checkUpdate';
import { appIcon, getMenuIcon } from './icon';
import { IConfig } from './index';
import { getPlatform } from './getPlatform';
const iconImage = nativeImage
  .createFromPath(appIcon)
  .resize({ width: 16, height: 16 }); // 调整图标大小

export const createMenubar = (config: IConfig, deps: any, server: any) => {
  return function (win: BrowserWindow) {
    const recentWikis = (config.get('recentWikis') || []).filter(
      (path: string) => path !== config.get('wikiPath')
    );

    const fileMenu: MenuItemConstructorOptions = {
      label: t('menu.file'),
      // icon: getMenuIcon('File'), // 设计不支持
      submenu: [
        {
          label: t('menu.openExistingWiki'),
          // @ts-ignore
          icon: config.get('icon') ? iconImage : null,
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const res = await deps.openWiki();
            if (res?.port) {
              server.currentPort = res.port;
            }
          },
        },
        {
          label: t('menu.createNewWiki'),
          accelerator: 'CmdOrCtrl+N',
          icon: getMenuIcon('new-wiki'),
          click: async () => {
            const res = await deps.createNewWiki();
            if (res?.port) {
              server.currentPort = res.port;
            }
          },
        },
        { type: 'separator' },
        {
          label: t('menu.recentWikis'),
          icon: getMenuIcon('recent'),
          submenu: [
            ...recentWikis.map((wikiPath: string) => ({
              label: wikiPath,
              icon: getMenuIcon('folder'),
              click: async () => {
                config.set('wikiPath', wikiPath);
                const { port } = await deps.initWiki(wikiPath);
                server.currentPort = port;
              },
            })),
            { type: 'separator' },
            {
              label: t('menu.clearRecentWikis'),
              icon: getMenuIcon('clear'),
              enabled: recentWikis.length > 0,
              click: () => {
                config.set('recentWikis', []);
                const updatemenu = server.menu.items
                  // @ts-ignore
                  .find((item) => item.label === t('menu.file'))
                  .submenu.items.find(
                    // @ts-ignore
                    (item) => item.label === t('menu.recentWikis')
                  );
                // updatemenu.submenu.items = null;
                // updatemenu.label = updatemenu.label + ' (0)';
                updatemenu.enabled = false;
                Menu.setApplicationMenu(server.menu);
              },
            },
          ],
        },
        { type: 'separator' },
        {
          label: t('menu.importWiki'),
          icon: getMenuIcon('import'),
          click: deps.importSingleFileWiki,
        },
        {
          label: t('menu.publish'),
          icon: getMenuIcon('release'),
          click: deps.releaseWiki,
          // submenu: [
          //   {
          //     label: t('menu.publishToGitHub'),
          //     click: deps.releaseWiki,
          //   },
          // ],
        },
        {
          label: t('menu.buildWiki'),
          icon: getMenuIcon('build'),
          click: deps.buildWiki,
        },
        { type: 'separator' },
        {
          label: t('menu.restart'),
          icon: getMenuIcon('restart'),
          // @see https://github.com/electron-userland/electron-builder/issues/1727
          visible: getPlatform() === 'linux' ? false : true,
          accelerator: 'CmdOrCtrl+Shift+Alt+R',
          click: () => {
            app.relaunch();
            app.exit(0);

            // const options: Electron.RelaunchOptions = { args: process.argv };
            // if (process.env.APPIMAGE) {
            //   options.execPath = process.env.APPIMAGE;
            //   options.args = options.args ?? [];
            //   options.args.unshift('--appimage-extract-and-run');
            // }

            // app.relaunch(options);
            // app.quit();
          },
        },
        // { type: 'separator' },
        {
          label: t('menu.exit'),
          icon: getMenuIcon('exit'),
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit',
        },
      ],
    };
    const viewMenu: MenuItemConstructorOptions = {
      label: t('menu.view'),
      submenu: [
        {
          role: 'reload',
          icon: getMenuIcon('reload'),
          label: t('menu.reload'),
        },
        {
          role: 'forceReload',
          icon: getMenuIcon('reload'),
          label: t('menu.forceReload'),
        },
        { type: 'separator' },
        {
          role: 'resetZoom',
          icon: getMenuIcon('reset'),
          label: t('menu.resetZoom'),
        },
        {
          role: 'zoomIn',
          label: t('menu.zoomIn'),
          icon: getMenuIcon('zoomIn'),
          accelerator: 'CmdOrCtrl+=',
        },
        {
          role: 'zoomOut',
          label: t('menu.zoomOut'),
          icon: getMenuIcon('zoomOut'),
        },
        { type: 'separator' },
        {
          role: 'togglefullscreen',
          icon: getMenuIcon('screens'),
          label: t('menu.toggleFullscreen'),
          accelerator: 'F11',
        },
        {
          label: t('menu.toggleMenuBar'),
          icon: getMenuIcon('settings'),
          accelerator: 'Alt+M',
          click: () => {
            const isVisible = win.isMenuBarVisible();
            win.setMenuBarVisibility(!isVisible);
          },
        },
        {
          label: t('menu.openInBrowser'),
          icon: getMenuIcon('web'),
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (server.currentPort) {
              shell.openExternal(`http://localhost:${server.currentPort}`);
            }
          },
        },
        {
          label: t('menu.openFolder'),
          icon: getMenuIcon('folder'),
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            shell.openPath(config.get('wikiPath'));
          },
        },
      ],
    };
    const settingsMenu: MenuItemConstructorOptions = {
      label: t('menu.settings'),
      submenu: [
        {
          label: t('menu.markdown'),
          type: 'checkbox',
          checked: config.get('markdown'),
          click: (menuItem: MenuItem) => deps.toggleMarkdown(menuItem.checked),
        },
        {
          label: t('menu.autocorrect'),
          type: 'checkbox',
          checked: config.get('autocorrect'),
          click: async (menuItem: MenuItem) =>
            await deps.toggleAutocorrect(menuItem),
        },
        {
          label: t('menu.enableIcon'),
          type: 'checkbox',
          checked: config.get('icon'),
          click: async (menuItem: MenuItem) =>
            await deps.toggleIcon(menuItem.checked),
        },
        {
          label: t('menu.langCN'),
          type: 'checkbox',
          checked: config.get('lang-CN'),
          click: (menuItem: MenuItem) =>
            deps.toggleChineseLang(menuItem.checked),
        },
        {
          label: t('menu.autoStart'),
          visible:
            process.platform === 'win32' || process.platform === 'darwin',
          type: 'checkbox',
          checked: app.getLoginItemSettings().openAtLogin,
          click: () => {
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
        {
          label: t('menu.githubConfig'),
          icon: getMenuIcon('settings'),
          click: deps.configureGitHub,
        },
        {
          label: t('menu.language'),
          icon: getMenuIcon('i18n'),
          submenu: [
            {
              label: '简体中文',
              type: 'radio',
              // icon: getMenuIcon('File'),
              checked: i18next.language === 'zh-CN',
              click: () => deps.switchLanguage('zh-CN'),
            },
            {
              label: 'English',
              type: 'radio',
              checked: i18next.language === 'en-US',
              click: () => deps.switchLanguage('en-US'),
            },
          ],
        },
      ],
    };
    const helpMenu: MenuItemConstructorOptions = {
      label: t('menu.help'),
      submenu: [
        {
          label: t('menu.devTools'),
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => win.webContents.openDevTools({ mode: 'right' }),
          icon: getMenuIcon('devtools'),
        },
        {
          label: t('menu.checkUpdate'),
          click: () => checkForUpdates(win),
          icon: getMenuIcon('update'),
        },
        {
          label: t('menu.showLogs'),
          icon: getMenuIcon('log'),
          click: () => {
            shell.openPath(app.getPath('logs'));
          },
        },
        {
          label: t('menu.reportIssue'),
          icon: getMenuIcon('issue'),
          click: () =>
            shell.openExternal(
              'https://github.com/oeyoews/tiddlywiki-app/issues'
            ),
        },
        {
          label: t('menu.twdocs'),
          icon: getMenuIcon('read'),
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
          icon: getMenuIcon('link'),
          click: () => shell.openExternal('https://talk.tiddlywiki.org/'),
        },
        {
          label: t('menu.about'),
          click: deps.showWikiInfo2,
          icon: getMenuIcon('about'),
        },
      ],
    };

    const menubars: MenuItemConstructorOptions[] = [
      fileMenu,
      viewMenu,
      settingsMenu,
      helpMenu,
    ];
    return menubars;
  };
};
