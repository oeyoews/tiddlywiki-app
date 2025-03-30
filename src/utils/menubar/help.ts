import { shell, app, MenuItemConstructorOptions, dialog } from 'electron';
import { getMenuIcon } from '@/utils/icon';
import { checkForUpdates } from '@/utils/checkUpdate';
import { showWikiInfo, server } from '@/utils';
import { showInputBox } from '@/modules/showInputBox';
import { i18next, t } from '@/i18n';

const { autoUpdater } = require('electron-updater');

// 需要等到 t 初始化
export const helpMenu = (): MenuItemConstructorOptions => ({
  label: t('menu.help'),
  id: 'Help',
  submenu: [
    {
      label: t('menu.devTools'),
      accelerator: 'CmdOrCtrl+Shift+I',
      click: () => server.win.webContents.openDevTools({ mode: 'right' }),
      icon: getMenuIcon('console'),
    },
    {
      label: t('menu.devTools'),
      click: async () => {
        const result = await showInputBox(
          server.win,
          t('dialog.inputPassword')
        );
        console.log(result, 'result');
        if (!result) return;
        dialog.showMessageBox({
          title: result as string,
          message: result as string,
        });
      },
      icon: getMenuIcon('console'),
    },
    {
      label: t('menu.checkUpdate'),
      // @see https://www.electronjs.org/zh/docs/latest/api/auto-updater
      // visible: getPlatform() === 'windows',
      id: 'update',
      enabled: app.isPackaged,
      click: checkForUpdates,
      icon: getMenuIcon('update'),
    },
    {
      label: t('dialog.checkingUpdate'),
      id: 'updating',
      visible: false,
      enabled: false,
      icon: getMenuIcon('update'),
    },
    {
      label: t('dialog.downloading'),
      id: 'downloadingApp',
      visible: false,
      enabled: false,
      icon: getMenuIcon('downloading'),
    },
    {
      label: t('dialog.restartNow'),
      id: 'restartApp',
      visible: false,
      click: () => autoUpdater.quitAndInstall(true, true), // 静默安装并启动
      icon: getMenuIcon('update'),
    },
    {
      label: t('menu.showLogs'),
      icon: getMenuIcon('log'),
      click: () => {
        shell.openPath(app.getPath('logs'));
      },
    },
    {
      label: t('menu.reportIssue'),
      icon: getMenuIcon('issue'),
      click: () =>
        shell.openExternal('https://github.com/oeyoews/tiddlywiki-app/issues'),
    },
    {
      label: t('menu.twdocs'),
      icon: getMenuIcon('read'),
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
      icon: getMenuIcon('link2'),
      click: () => shell.openExternal('https://talk.tiddlywiki.org/'),
    },
    {
      label: t('menu.about'),
      click: showWikiInfo,
      icon: getMenuIcon('about'),
    },
  ],
});
