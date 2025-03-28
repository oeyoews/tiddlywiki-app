import { t } from '@/i18n/index';
import {
  type MenuItemConstructorOptions,
  Menu,
  shell,
  MenuItem,
  Tray,
  dialog,
} from 'electron';
import fs from 'fs';

import { log } from '@/utils/logger';

import { getMenuIcon } from '@/utils/icon';
import { type IConfig } from '@/utils';
import { generateId } from '../generateId';
import { helpMenu } from '@/utils/menubar/hep';
import { settingsMenu } from '@/utils/menubar/settings';
import { viewMenu } from './view';
import { fileMenu } from './file';

export const createMenubar = (
  config: IConfig,
  server: {
    currentPort: number;
    menu: Menu;
    tray: Tray;
    currentServer: null;
  }
) => {
  return function () {
    const recentWikis = (config.get('recentWikis') || []).filter(
      (path: string) => path !== config.get('wikiPath')
    );

    const mwikis = recentWikis.map((wikiPath: string) => ({
      id: generateId(wikiPath),
      label: wikiPath,
      icon: getMenuIcon('trash'),
      click: async (menuItem: MenuItem) => {
        const { id, label } = menuItem;
        // 检查文件是否存在
        const folderExist = fs.existsSync(label); // 自定义函数检查文件是否存在
        let newRecentWikis;
        if (!folderExist) {
          newRecentWikis = (config.get('recentWikis') || []).filter(
            (path: string) => label !== path
          );

          // 更新 recent
          config.set('recentWikis', newRecentWikis);
          log.info(label, 'folder not exist');
          const item = server.menu.getMenuItemById(id);
          if (item?.visible) {
            item.visible = false;
            Menu.setApplicationMenu(server.menu);
          }
          return;
        }

        newRecentWikis = (config.get('recentWikis') || []).filter(
          (path: string) => label !== path && label !== path
        );
        const res = await dialog.showMessageBox({
          title: t('dialog.delete'),
          icon: getMenuIcon('trash', 256),
          message: t('dialog.moveToTrash', { folder: wikiPath }),
          buttons: [t('dialog.confirm'), t('dialog.cancel')],
          cancelId: 1,
          defaultId: 1,
        });

        if (res.response === 0) {
          // fs.rmSync(label, { force: true, recursive: true }); // NOTE: 永久删除
          await shell.trashItem(label); // 移动到垃圾桶
          config.set('recentWikis', newRecentWikis);
          const item = server.menu.getMenuItemById(id);
          if (item?.visible) {
            item.visible = false;
            Menu.setApplicationMenu(server.menu);
          }
        }
      },
    }));

    const manageWikiMenu: MenuItemConstructorOptions = {
      label: t('menu.wikis'),
      submenu: [
        // C:\\Users\\Lenovo\\Desktop\\chat-app\\wiki-test 长度过长， 少一位刚刚好???
        ...mwikis,
      ],
    };

    const menubars: MenuItemConstructorOptions[] = [
      fileMenu(recentWikis),
      viewMenu(),
      manageWikiMenu,
      settingsMenu(),
      helpMenu(),
    ];
    return menubars;
  };
};
