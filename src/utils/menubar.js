import { t, i18next } from '@/i18n/index';
import { shell, app } from 'electron';

export const createMenubar = (win, config, deps, server) => {
  return function () {
    const recentWikis = (config.get('recentWikis') || []).filter(
      (path) => path !== config.get('wikiPath')
    );

    const menubars = [
      {
        label: t('menu.file'),
        submenu: [
          {
            label: t('menu.openExistingWiki'),
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
            submenu: [
              ...recentWikis.map((wikiPath) => ({
                label: wikiPath,
                click: async () => {
                  config.set('wikiPath', wikiPath);
                  const { port } = await deps.initWiki(wikiPath);
                  server.currentPort = port;
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
            click: deps.importSingleFileWiki,
          },
          {
            label: t('menu.publish'),
            submenu: [
              {
                label: t('menu.publishToGitHub'),
                click: deps.releaseWiki,
              },
            ],
          },
          {
            label: t('menu.buildWiki'),
            click: deps.buildWiki,
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
              const isVisible = win.isMenuBarVisible();
              win.setMenuBarVisibility(!isVisible);
            },
          },
          {
            label: t('menu.openInBrowser'),
            accelerator: 'CmdOrCtrl+Shift+O',
            click: () => {
              if (server.currentPort) {
                shell.openExternal(`http://localhost:${server.currentPort}`);
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
            click: (menuItem) => deps.toggleMarkdown(menuItem.checked),
          },
          {
            label: t('menu.autocorrect'),
            type: 'checkbox',
            checked: config.get('autocorrect'),
            click: async (menuItem) => await deps.toggleAutocorrect(menuItem),
          },
          {
            label: t('menu.langCN'),
            type: 'checkbox',
            checked: config.get('lang-CN'),
            click: (menuItem) => deps.toggleChineseLang(menuItem.checked),
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
            click: deps.configureGitHub,
          },
          {
            label: t('menu.language'),
            submenu: [
              {
                label: '简体中文',
                type: 'radio',
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
      },
      {
        label: t('menu.help'),
        submenu: [
          {
            label: t('menu.devTools'),
            accelerator: 'CmdOrCtrl+Shift+I',
            click: () => win.webContents.openDevTools({ mode: 'right' }),
          },
          {
            label: t('menu.checkUpdate'),
            click: deps.checkForUpdates,
            enabled: !deps.var.downloadFinished,
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
            click: deps.showWikiInfo2,
          },
        ],
      },
    ];
    return menubars;
  };
};
