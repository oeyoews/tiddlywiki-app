import { app, Menu, Tray, BrowserWindow } from 'electron';
import { getAppIcon, getMenuIcon } from './icon';
import { getPlatform } from './getPlatform';
import { log } from '@/utils/logger';
import { t } from 'i18next';

// 修改 createTray 函数中的菜单项
enum TrayIconSize {
  windows = 24,
  macOs = 22,
  linux = 32,
}

export function createTray(
  win: BrowserWindow,
  server: {
    tray: Tray;
  }
) {
  const platform = getPlatform();

  if (!server.tray) {
    const trayIconSize =
      TrayIconSize[platform as keyof typeof TrayIconSize] ?? TrayIconSize.windows;

    server.tray = new Tray(getAppIcon(trayIconSize)!);
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
  server.tray.setTitle(t('tray.tooltip'));
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
