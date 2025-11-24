import { app, Menu, Tray, BrowserWindow } from 'electron';
import { getAppIcon, getMenuIcon } from './icon';
import { getPlatform } from './getPlatform';
import { log } from '@/utils/logger';
import { t } from 'i18next';

export function createTray(
  win: BrowserWindow,
  server: {
    tray: Tray;
  }
) {
  const platform = getPlatform();

  if (!server.tray) {

    server.tray = new Tray(getAppIcon()!);
    server.tray.on('click', () => {
      if (!win.isVisible() || win.isMinimized()) {
        win.show();
        win.restore();
      } else {
        win.minimize();
      }
    });
  }
  server.tray.setToolTip(t('tray.tooltip'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('tray.showWindow'),
      icon: getMenuIcon(platform as any),
      click: () => {
        win.show();
      },
    },
    // {
    //   label: t('tray.openInBrowser'),
    //   click: () => {
    //     if (server.currentPort) {
    //       shell.openExternal(`http://localhost:${server.currentPort}`);
    //     }
    //   },
    // },
    // { type: 'separator' },
    // {
    //   label: t('tray.about'),
    //   click: showWikiInfo,
    // },
    {
      label: t('tray.exit'),
      icon: getMenuIcon('exit'),
      click: () => {
        log.info('exit fomr tray');
        app.quit();
      },
    },
  ]);
  server.tray.setContextMenu(contextMenu);
}
