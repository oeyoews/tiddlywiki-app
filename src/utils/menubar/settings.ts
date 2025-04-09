import { i18next } from '@/i18n/index';
import {
  type MenuItemConstructorOptions,
  app,
  dialog,
  MenuItem,
  shell,
} from 'electron';
import { log } from '@/utils/logger';
import { getMenuIcon } from '../icon';
import { config } from '../config';
import {
  switchLanguage,
  toggleIcon,
  toggleAutocorrect,
  toggleMarkdown,
  toggleChineseLang,
  server,
  restartDialog,
} from '@/utils';
import { t } from 'i18next';
import { showInputBox } from '@/modules/showInputBox';

export const settingsMenu = (): MenuItemConstructorOptions => ({
  label: t('menu.settings'),
  id: 'Setting',
  submenu: [
    // {
    //   label: t('menu.enableBeta'),
    //   type: 'checkbox',
    //   checked: config.get('betaChannel'),
    //   click: (menuItem: MenuItem) =>
    //     deps.toggleEnableBeta(menuItem.checked),
    // },
    {
      label: t('menu.markdown'),
      type: 'checkbox',
      icon: getMenuIcon('markdown'),
      checked: config.get('markdown'),
      click: (menuItem: MenuItem) => toggleMarkdown(menuItem.checked),
    },
    {
      label: t('menu.autocorrect'),
      type: 'checkbox',
      icon: getMenuIcon('format'),
      checked: config.get('autocorrect'),
      click: async (menuItem: MenuItem) => await toggleAutocorrect(menuItem),
    },
    {
      label: t('menu.autoStart'),
      visible: process.platform === 'win32' || process.platform === 'darwin',
      icon: getMenuIcon('power'),
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: () => {
        if (!app.isPackaged) {
          app.setLoginItemSettings({
            openAtLogin: !app.getLoginItemSettings().openAtLogin,
            path: process.execPath, // or use app.getPath('exe'),
          });
          log.info(
            'dev: test autoStart',
            app.getLoginItemSettings().openAtLogin
          );
        } else {
          log.info(
            'before toggle autoStart',
            app.getLoginItemSettings().openAtLogin
          );
          app.setLoginItemSettings({
            openAtLogin: !app.getLoginItemSettings().openAtLogin,
            path: process.execPath, // or use app.getPath('exe'),
          });
          log.info(
            app.getLoginItemSettings().openAtLogin,
            'after: autoStart toggled'
          );
        }
      },
    },
    {
      label: t('menu.shareWiki'),
      icon: getMenuIcon('host'),
      type: 'checkbox',
      checked: !!config.get('lan'),
      click: (menuItem) => {
        config.set('lan', menuItem.checked);
        restartDialog();
      },
    },
    {
      label: t('menu.winState'),
      icon: getMenuIcon('winState'),
      type: 'checkbox',
      checked: !!config.get('winState'),
      click: (menuItem) => {
        config.set('winState', menuItem.checked);
        restartDialog();
      },
    },
    {
      label: t('menu.defaultPort'),
      icon: getMenuIcon('gear'),
      click: async () => {
        const res = await showInputBox(
          server.win,
          t('menu.defaultPort'),
          'text',
          config.get('defaultPort').toString()
        );
        if (
          res &&
          res.length >= 2 &&
          !isNaN(Number(res)) &&
          Number(res) < 65535
        ) {
          config.set('defaultPort', Number(res));
        } else if (res?.length > 0) {
          dialog.showErrorBox('Error', 'new port value is not valid');
        }
      },
    },
    {
      label: t('menu.githubConfig'),
      icon: getMenuIcon('gear'),
      click: () => {
        const token = config.get('github')?.token;
        server.win.webContents.send('config-github', token);
      },
    },
    {
      label: t('menu.username'),
      icon: getMenuIcon('username'),
      click: async () => {
        const res = await showInputBox(
          server.win,
          t('dialog.inputUsername'),
          'text',
          config.get('username')!
        );
        if (res) {
          config.set('username', res);
          restartDialog();
        }
      },
    },
    {
      label: t('menu.language'),
      icon: getMenuIcon('i18n'),
      submenu: [
        {
          label: '简体中文',
          type: 'radio',
          // icon: getMenuIcon('File'),
          checked: i18next.language.startsWith('zh'),
          click: () => switchLanguage('zh-CN'),
        },
        {
          label: 'English',
          type: 'radio',
          checked: i18next.language === 'en-US',
          click: () => switchLanguage('en-US'),
        },
      ],
    },
    {
      label: t('menu.openSettings'),
      icon: getMenuIcon('config'),
      click: () => {
        shell.openPath(config.fileName);
      },
    },
    {
      label: t('menu.enableIcon'),
      type: 'checkbox',
      checked: config.get('icon'),
      click: async (menuItem: MenuItem) => await toggleIcon(menuItem.checked),
    },
    {
      label: t('menu.langCN'),
      type: 'checkbox',
      checked: config.get('lang-CN'),
      click: (menuItem: MenuItem) => toggleChineseLang(menuItem.checked),
    },
  ],
});
