import { t, i18next } from '@/i18n/index';
import { type MenuItemConstructorOptions, app, MenuItem } from 'electron';
import { log } from '@/utils/logger';
import { getMenuIcon } from '../icon';
import { config } from '../config';
import {
  switchLanguage,
  toggleIcon,
  toggleAutocorrect,
  toggleMarkdown,
  configureGitHub,
  toggleChineseLang,
} from '@/utils';

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
      label: t('menu.githubConfig'),
      icon: getMenuIcon('settings'),
      click: configureGitHub,
    },
    {
      label: t('menu.language'),
      icon: getMenuIcon('i18n'),
      submenu: [
        {
          label: '简体中文',
          type: 'radio',
          // icon: getMenuIcon('File'),
          checked: i18next.language === 'zh-CN',
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
