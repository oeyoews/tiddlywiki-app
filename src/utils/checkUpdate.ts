const { autoUpdater } = require('electron-updater');
import { log } from '@/utils/logger';
import { updaterConfig } from '@/utils/updater';
import { dialog, Menu, type BrowserWindow } from 'electron';
import { t } from '@/i18n';
import { getMenuIcon } from '@/utils/icon';

autoUpdater.autoDownload = false;

export async function checkForUpdates(
  win: BrowserWindow,
  server: {
    menu: Menu;
  }
) {
  let updateAvailableHandled = false;
  let downloadFinished = false;
  let hasLatestNotify = false;

  const updateMenu = server.menu.getMenuItemById('update')!;
  const updatingMenu = server.menu.getMenuItemById('updating')!;
  const downloadingApp = server.menu.getMenuItemById('downloadingApp')!;
  const restartMenu = server.menu.getMenuItemById('restartApp')!;

  type IUpdateMenuType =
    | 'updateMenu'
    | 'updatingMenu'
    | 'downloadingApp'
    | 'restartMenu';

  function updateMenuVisibility(menuType: IUpdateMenuType) {
    // 存储所有菜单
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

  // updateMenu.label = t('dialog.checkingUpdate'); // not work 不可变属性

  updateMenuVisibility('updatingMenu');

  try {
    // 模拟打包环境
    // if (!app.isPackaged) {
    //   Object.defineProperty(app, 'isPackaged', {
    //     get: () => true,
    //   });
    // }

    autoUpdater.setFeedURL(updaterConfig);

    autoUpdater.on('checking-for-update', () => {
      log.info('checking-for-update');
      win.setProgressBar(0.2);
      // checkMenu.label = t('dialog.updateChecking');
      // Menu.setApplicationMenu(menu);
    });

    autoUpdater.on('update-available', async (info: any) => {
      if (updateAvailableHandled) return; // 防止重复弹窗
      updateAvailableHandled = true;

      log.info('update available');
      // checkMenu.enabled = false;
      // Menu.setApplicationMenu(menu);

      const result = await dialog.showMessageBox({
        // icon: appIcon,
        type: 'info',
        title: t('dialog.updateAvailable'),
        message: t('dialog.newVersion', { version: info.version }),
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
      if (hasLatestNotify) return; // 防止重复弹窗

      updateMenuVisibility('updateMenu');

      hasLatestNotify = true;
      win.setProgressBar(-1);
      dialog.showMessageBox({
        icon: getMenuIcon('about', 256),
        type: 'info',
        title: t('dialog.updateCheck'),
        message: t('dialog.noUpdate'),
      });
    });

    autoUpdater.on('download-progress', (progressObj: any) => {
      log.info(progressObj.percent.toFixed(2) + '%', 'Updating');
      win.setProgressBar(progressObj.percent / 100);
    });

    autoUpdater.on('update-downloaded', async (info: any) => {
      if (downloadFinished) return; // 防止重复弹窗
      log.info('update downloaded');

      updateMenuVisibility('restartMenu');

      downloadFinished = true;
      win.setProgressBar(-1);
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
        autoUpdater.quitAndInstall();
      }
    });

    autoUpdater.on('error', (err: any) => {
      // TODO: 防重
      // if (updateMenu?.enabled === false) {
      //   updateMenu.enabled = true;
      // }
      updateMenuVisibility('updateMenu');

      win.setProgressBar(-1);
      dialog.showErrorBox(
        t('dialog.error'),
        t('dialog.updateError', { message: err.message })
      );
    });

    // 重置变量
    // updateAvailableHandled = false;
    // downloadFinished = false;
    // hasLatestNotify = false;

    await autoUpdater.checkForUpdates();
  } catch (err: any) {
    updateMenuVisibility('updateMenu');
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.updateError', { message: err.message })
    );
  }
}
