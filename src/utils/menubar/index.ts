import {
  type MenuItemConstructorOptions,
  Menu,
  shell,
  MenuItem,
  Tray,
  dialog,
  BrowserWindow,
} from 'electron';
import fs from 'fs';

import { log } from '@/utils/logger';

import { getMenuIcon } from '@/utils/icon';
import { type IConfig } from '@/utils';
import { generateId } from '../generateId';
import { helpMenu } from '@/utils/menubar/help';
import { settingsMenu } from '@/utils/menubar/settings';
import { viewMenu } from './view';
import { fileMenu } from './file';
import { t } from 'i18next';
import { editMenu } from './edit';
import { getPlatform } from '../getPlatform';
import { wikisMenu } from './wikis';

export const createMenubar = (
  config: IConfig,
  server: {
    currentPort: number;
    menu: Menu;
    tray: Tray;
    currentServer: null;
    win: BrowserWindow;
  }
) => {
  return function () {
    // const recentWikis = (config.get('recentWikis') || []).filter(
    //   (path: string) => path !== config.get('wikiPath')
    // );
    const recentWikis = config.get('recentWikis') || [];
    const currentWiki = config.get('wikiPath');
    const runningWikis = config.get('runningWikis') || [];

    // const manageWikiMenu: MenuItemConstructorOptions = {
    //   label: t('menu.wikis'),
    //   submenu: [
    //     // C:\\Users\\Lenovo\\Desktop\\chat-app\\wiki-test 长度过长， 少一位刚刚好???
    //     ...mwikis,
    //   ],
    // };

    const recentWikisWithTag = recentWikis.map((item) => {
      const wiki = {
        path: item,
        running: false,
        isCurrentWiki: false,
      };
      if (runningWikis.includes(item)) {
        wiki.running = true;
        if (item === currentWiki) {
          wiki.isCurrentWiki = true;
        }
      }
      return wiki;
    });

    const menubars: MenuItemConstructorOptions[] = [
      fileMenu(),
      viewMenu(),
      // manageWikiMenu,
      wikisMenu(recentWikisWithTag),
      settingsMenu(),
      helpMenu(),
    ];

    if (getPlatform() === 'macOs') {
      menubars.splice(1, 0, editMenu());
    }

    return menubars;
  };
};
