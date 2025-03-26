const { autoUpdater } = require('electron-updater');
import { log } from '@/utils/logger';
import { updaterConfig } from '@/utils/updater';
import { app, dialog, Menu, MenuItem } from 'electron';
import { t } from '@/i18n';
import { getMenuIcon } from '@/utils/icon';
import { server } from '@/utils';

let updateMenu: MenuItem;
let updatingMenu: MenuItem;
let downloadingApp: MenuItem;
let restartMenu: MenuItem;

function updateMenuVisibility(menuType: IUpdateMenuType) {
  if (!updateMenu) updateMenu = server.menu.getMenuItemById('update')!;
  if (!updatingMenu) updatingMenu = server.menu.getMenuItemById('updating')!;
  if (!downloadingApp)
    downloadingApp = server.menu.getMenuItemById('downloadingApp')!;
  if (!restartMenu) restartMenu = server.menu.getMenuItemById('restartApp')!;

  const menus = { updateMenu, updatingMenu, downloadingApp, restartMenu };

  // 将所有菜单的 visible 设置为 false
  (Object.keys(menus) as IUpdateMenuType[]).forEach(
    (menu) => (menus[menu].visible = false)
  );

  // 设置指定菜单的 visible 为 true
  if (menus[menuType]) {
    menus[menuType].visible = true;
  }
  Menu.setApplicationMenu(server.menu);
}

export function autoUpdaterInit() {
  autoUpdater.autoDownload = false;
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  autoUpdater.on('checking-for-update', () => {
    log.info('checking-for-update');
    server.win.setProgressBar(0.2);
    // checkMenu.label = t('dialog.updateChecking');
    // Menu.setApplicationMenu(menu);
  });

  autoUpdater.on('update-available', async (info: any) => {
    log.info('update available');
    // checkMenu.enabled = false;
    // Menu.setApplicationMenu(menu);

    const result = await dialog.showMessageBox({
      type: 'info',
      title: t('dialog.updateAvailable'),
      message: t('dialog.newVersion', { version: info.version }),
      icon: getMenuIcon('about', 256),
      // detail: t('dialog.downloading'),
      // buttons: ['confirm', 'cancel'],
      buttons: [t('dialog.confirm'), t('dialog.cancel')],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
      updateMenuVisibility('downloadingApp');
      log.info('updating now');
    } else {
      log.info('update canceled');
      updateMenuVisibility('updateMenu');
    }
  });

  autoUpdater.on('update-not-available', () => {
    updateMenuVisibility('updateMenu');

    server.win.setProgressBar(-1);
    dialog.showMessageBox({
      icon: getMenuIcon('about', 256),
      type: 'info',
      title: t('dialog.updateCheck'),
      message: t('dialog.noUpdate'),
    });
  });

  autoUpdater.on('download-progress', (progressObj: any) => {
    log.info(progressObj.percent.toFixed(2) + '%', 'Updating');
    server.win.setProgressBar(progressObj.percent / 100);
  });

  autoUpdater.on('update-downloaded', async (info: any) => {
    log.info('update downloaded');

    updateMenuVisibility('restartMenu');

    server.win.setProgressBar(-1);
    const result = await dialog.showMessageBox({
      icon: getMenuIcon('restart', 256),
      type: 'info',
      title: t('dialog.updateReady'),
      message: t('dialog.updateReadyMessage', { version: info.version }),
      buttons: [t('dialog.restartNow'), t('dialog.later')],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      autoUpdater.quitAndInstall(true, true);
    }
  });

  // TODO: 触发两次 ?? 错误重试？？？
  autoUpdater.on('error', (err: any) => {
    updateMenuVisibility('updateMenu');

    server.win.setProgressBar(-1);
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.updateError', { message: err.message })
    );
  });
}

export async function checkForUpdates() {
  // if (config.get('betaChannel')) {
  //   autoUpdater.channel = 'beta';
  //   log.info('use beta channel for update');
  // }
  try {
    // 模拟打包环境
    // if (!app.isPackaged) {
    //   Object.defineProperty(app, 'isPackaged', {
    //     get: () => true,
    //   });
    // }

    // updateMenu.label = t('dialog.checkingUpdate'); // not work 不可变属性
    if (app.isPackaged) {
      autoUpdater.setFeedURL(updaterConfig);
      updateMenuVisibility('updatingMenu');
      await autoUpdater.checkForUpdates();
    }
  } catch (err: any) {
    updateMenuVisibility('updateMenu');
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.updateError', { message: err.message })
    );
  }
}
