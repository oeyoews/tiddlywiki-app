import {
  type MenuItemConstructorOptions,
  // Menu,
  // Tray,
  // BrowserWindow,
} from 'electron';
import { server, type IConfig } from '@/utils';
import { helpMenu } from '@/utils/menubar/help';
import { settingsMenu } from '@/utils/menubar/settings';
import { viewMenu } from './view';
import { fileMenu } from './file';
import { editMenu } from './edit';
import { getPlatform } from '../getPlatform';
import { wikisMenu } from './wikis';
import { generateId } from '../generateId';

export const createMenubar = (config: IConfig) => {
  return function () {
    const recentWikis = config.get('recentWikis') || [];
    const currentWiki = config.get('wikiPath');

    const recentWikisWithTag = recentWikis.map((item) => {
      const wiki = {
        port: null as any,
        path: item,
        isCurrentWiki: false,
        isRunning: false,
      };
      if (currentWiki === item) {
        wiki.isCurrentWiki = true;
      }
      const wikiServer = server.twServers.get(generateId(item));
      if (wikiServer?.port) {
        wiki.port = wikiServer.port;
        wiki.isRunning = true;
      }
      return wiki;
    });

    const menubars: MenuItemConstructorOptions[] = [
      fileMenu(),
      viewMenu(),
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
