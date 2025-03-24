const { autoUpdater } = require('electron-updater');
import { log } from '@/utils/logger';
import { updaterConfig } from '@/utils/updater';
import { dialog, type BrowserWindow } from 'electron';
import { t } from '@/i18n';

autoUpdater.autoDownload = false;
log.info('disabled autoDownload');

export async function checkForUpdates(win: BrowserWindow) {
  let updateAvailableHandled = false;
  let downloadFinished = false;
  let hasLatestNotify = false;

  try {
    // 模拟打包环境
    // if (!app.isPackaged) {
    //   Object.defineProperty(app, 'isPackaged', {
    //     get: () => true,
    //   });
    // }

    // const checkMenu = menu.items
    //   .find((item) => item.label === t('menu.help'))
    //   .submenu.items.find((item) => item.label === t('menu.checkUpdate'));

    autoUpdater.setFeedURL(updaterConfig as any);

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
      } else {
        log.info('update canceled');
      }
    });

    autoUpdater.on('update-not-available', () => {
      if (hasLatestNotify) return; // 防止重复弹窗
      hasLatestNotify = true;
      win.setProgressBar(-1);
      dialog.showMessageBox({
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
      // checkMenu.label = t('menu.restart');
      // checkMenu.enabled = true;
      // Menu.setApplicationMenu(menu);
      log.info('update downloaded');

      downloadFinished = true;
      win.setProgressBar(-1);
      const result = await dialog.showMessageBox({
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
    dialog.showErrorBox(
      t('dialog.error'),
      t('dialog.updateError', { message: err.message })
    );
  }
}
