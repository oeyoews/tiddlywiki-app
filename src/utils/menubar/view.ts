import { t } from '@/i18n/index';
import { app, type MenuItemConstructorOptions, shell } from 'electron';
import path from 'path';

import { getFolderIcon, getMenuIcon } from '@/utils/icon';
import { server } from '@/utils';
import { config } from '../config';
let showFindBar: any;

app.on('browser-window-created', async (_: any, win: any) => {
  const { setFindBar } = await import('@/main/find-bar');
  showFindBar = setFindBar(win, { top: 55 });
});

export const viewMenu = (): MenuItemConstructorOptions => ({
  label: t('menu.view'),
  id: 'View',
  submenu: [
    {
      icon: getMenuIcon('search'),
      label: t('menu.search'),
      accelerator: 'CmdOrCtrl+F',
      click: showFindBar,
    },
    {
      icon: getMenuIcon('minimize'),
      label: t('menu.minimize'),
      accelerator: 'CmdOrCtrl+W',
      // click: server.win.minimize.bind(server.win),
      click: () => server.win.minimize(),
    },
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
        const isVisible = server.win.isMenuBarVisible();
        server.win.setMenuBarVisibility(!isVisible);
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
      icon: getFolderIcon(),
      accelerator: 'CmdOrCtrl+E',
      click: () => {
        shell.openPath(config.get('wikiPath'));
      },
    },
    {
      label: t('menu.subwiki'),
      accelerator: 'CmdOrCtrl+Shift+E',
      icon: getMenuIcon('subwiki'),
      click: () => {
        shell.openPath(path.join(config.get('wikiPath'), 'subwiki'));
      },
    },
  ],
});
