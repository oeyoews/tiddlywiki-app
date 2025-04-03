import {
  Menu,
  app,
  dialog,
  shell,
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
import { getMenuIcon, getWikiFolderIcon } from '@/utils/icon';
import fs from 'fs';
import { config } from '@/utils/config';
import { capitalizeWords, downloadTpl } from '../downloadTpl';
import { wikiTemplates } from '@/utils/wikiTemplates';
import { showInputBox } from '@/modules/showInputBox';
import { readMarkdownFolder } from '@/modules/markdown-importer';
import { log } from '../logger';
import { t } from 'i18next';

export const fileMenu = (
  recentWikis: IRecentWikisWithTag[]
): MenuItemConstructorOptions => ({
  label: t('menu.file'),
  id: 'File',
  // icon: getMenuIcon('File'), // 设计不支持
  submenu: [
    {
      label: t('menu.openExistingWiki'),
      // @ts-ignore
      icon: config.get('icon') ? getWikiFolderIcon() : null,
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
      icon: getMenuIcon('plus2'),
      submenu: Object.entries(wikiTemplates).map((tpl) => {
        if (tpl[0] === 'default') {
          return {
            label: t('menu.importWiki'),
            icon: getMenuIcon('import'),
            click: () => importSingleFileWiki(),
          };
        }
        if (tpl[0].startsWith('-')) {
          return { type: 'separator' };
        }
        if (tpl[0] === 'help') {
          return {
            label: t('menu.help'),
            icon: getMenuIcon('help'),
            click: async () => {
              const res = await dialog.showMessageBox({
                title: t('app.title'),
                icon: getMenuIcon('help', 256),
                message: '',
                buttons: [t('dialog.checkTemplates'), t('dialog.close')],
                defaultId: 0,
                cancelId: 1,
              });
              if (res.response === 0) {
                shell.openExternal(
                  'https://github.com/oeyoews/tiddlywiki-app/blob/main/src/utils/wikiTemplates.ts'
                );
              }
            },
          };
        }
        return {
          label: capitalizeWords(tpl[0]),
          // visible: tpl[0] !== 'tiddly-template', // 暂时隐藏tiddly-template
          icon: getMenuIcon('web_app'),
          click: async () => {
            await downloadTpl(
              tpl,
              (templatePath: string) => {
                importSingleFileWiki(templatePath, tpl[0] as any);
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
      icon: getMenuIcon('plus'),
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
        ...recentWikis.map(({ path: wikiPath, running }) => ({
          label: running ? wikiPath + ' (Runing)' : wikiPath,
          id: wikiPath,
          icon: getMenuIcon(running ? 'folder-opened' : 'folder'),
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
      click: () => releaseWiki(),
    },
    { type: 'separator' },
    {
      label: t('menu.buildWiki'),
      icon: getMenuIcon('export'),
      accelerator: 'CmdOrCtrl+S',
      click: () => buildWiki({}),
    },
    {
      label: t('menu.buildWikiWithPassWord'),
      icon: getMenuIcon('lock'),
      accelerator: 'CmdOrCtrl+Shift+S',
      click: async () => {
        const res = await showInputBox(server.win, t('dialog.inputPassword'));
        if (res) {
          buildWiki({ password: res });
        }
      },
    },
    { type: 'separator' },
    {
      label: t('menu.importMarkdown'),
      click: async () => {
        const content = await readMarkdownFolder();
        if (content.length === 0) {
          log.info('No markdown tiddlers found');
          return;
        }
        server.win.webContents.send('import-markdown', content);
      },
      icon: getMenuIcon('import'),
    },
    { type: 'separator' },
    {
      label: t('menu.restart'),
      icon: getMenuIcon('restart'),
      // @see https://github.com/electron-userland/electron-builder/issues/1727
      visible: !process.env.APPIMAGE,
      enabled: !process.env.APPIMAGE,
      accelerator: 'CmdOrCtrl+Shift+Alt+R',
      click: () => {
        app.relaunch();
        app.exit(0);
      },
    },
    {
      label: t('menu.exit'),
      icon: getMenuIcon('exit'),
      accelerator: 'CmdOrCtrl+Q',
      role: 'quit',
    },
  ],
});
