import { app, Menu, Tray, BrowserWindow } from 'electron';
import { appIcon } from './icon';
import { t } from '@/i18n';

// 修改 createTray 函数中的菜单项
export function createTray(win: BrowserWindow, server?: any) {
  const tray = new Tray(appIcon);
  tray.setToolTip(t('tray.tooltip'));
  tray.setTitle(t('tray.tooltip'));
  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('tray.showWindow'),
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
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (!win.isVisible() || win.isMinimized()) {
      win.show();
      win.restore();
    } else {
      win.minimize();
    }
  });
}
