import { t } from '@/i18n';
import {
  Menu,
  app,
  dialog,
  type MenuItem,
  type MenuItemConstructorOptions,
} from 'electron';
import {
  buildWiki,
  releaseWiki,
  createNewWiki,
  importSingleFileWiki,
  initWiki,
  openWiki,
  server,
} from '@/utils';
import { getAppIcon, getMenuIcon } from '@/utils/icon';
import fs from 'fs';
import { config } from '@/utils/config';
import { getPlatform } from '../getPlatform';
import { capitalizeWords, downloadTpl } from '../downloadTpl';
import { wikiTemplates } from '@/utils/wikiTemplates';

export const fileMenu = (
  recentWikis: string[]
): MenuItemConstructorOptions => ({
  label: t('menu.file'),
  id: 'File',
  // icon: getMenuIcon('File'), // 设计不支持
  submenu: [
    {
      label: t('menu.openExistingWiki'),
      // @ts-ignore
      icon: config.get('icon') ? getAppIcon(16) : null,
      accelerator: 'CmdOrCtrl+O',
      click: async () => {
        const res = await openWiki();
        if (res?.port) {
          server.currentPort = res.port;
        }
      },
    },
    {
      label: t('menu.wikiTemplate'),
      icon: getMenuIcon('new-folder-template'),
      submenu: Object.entries(wikiTemplates).map((tpl) => {
        if (tpl[0] === 'default') {
          return {
            label: t('menu.importWiki'),
            icon: getMenuIcon('import'),
            click: () => importSingleFileWiki(),
          };
        }
        if (tpl[0] === '-') {
          return { type: 'separator' };
        }
        return {
          label: capitalizeWords(tpl[0]),
          icon: getMenuIcon('html'),
          click: () => {
            downloadTpl(
              tpl,
              (templatePath: string) => {
                importSingleFileWiki(templatePath);
              },
              server.downloadNotify
            );
          },
        };
      }),
    },
    {
      label: t('menu.createNewWiki'),
      accelerator: 'CmdOrCtrl+N',
      icon: getMenuIcon('new-wiki'),
      click: async () => {
        const res = await createNewWiki();
        if (res?.port) {
          server.currentPort = res.port;
        }
      },
    },
    { type: 'separator' },
    {
      label: t('menu.recentWikis'),
      id: 'recentWikis',
      icon: getMenuIcon('recent'),
      submenu: [
        ...recentWikis.map((wikiPath: string) => ({
          label: wikiPath,
          id: wikiPath,
          icon: getMenuIcon('folder'),
          click: async (menuItem: MenuItem) => {
            if (!fs.existsSync(menuItem.id)) {
              const res = await dialog.showMessageBox({
                title: t('dialog.open'),
                message: t('dialog.open2', { folder: wikiPath }),
                buttons: [t('dialog.confirm'), t('dialog.cancel')],
                defaultId: 0,
                cancelId: 1,
              });
              if (res.response === 0) {
                config.set('wikiPath', wikiPath);
                const res = await initWiki(wikiPath);
                if (res?.port) {
                  server.currentPort = res.port;
                }
              }
            } else {
              config.set('wikiPath', wikiPath);
              const res = await initWiki(wikiPath);
              if (res?.port) {
                server.currentPort = res.port;
              }
            }
          },
        })),
        { type: 'separator' },
        {
          id: 'clearRecentWikis',
          label: t('menu.clearRecentWikis'),
          icon: getMenuIcon('clear'),
          enabled: recentWikis.length > 0,
          click: () => {
            const recentMenu = server.menu.getMenuItemById('recentWikis');
            config.set('recentWikis', []);
            if (recentMenu) {
              recentMenu.enabled = false;
            }
            Menu.setApplicationMenu(server.menu);
          },
        },
      ],
    },
    { type: 'separator' },
    // {
    //   label: t('menu.importWiki'),
    //   icon: getMenuIcon('import'),
    //   click: () => importSingleFileWiki(),
    // },
    {
      label: t('menu.publish'),
      icon: getMenuIcon('release'),
      click: releaseWiki,
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
      click: buildWiki,
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
});
