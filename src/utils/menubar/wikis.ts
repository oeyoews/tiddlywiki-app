import {
  dialog,
  Menu,
  shell,
  type MenuItem,
  type MenuItemConstructorOptions,
} from 'electron';
import { initWiki, server } from '@/utils';
import { getMenuIcon } from '@/utils/icon';
import fs from 'fs';
import { config } from '@/utils/config';
import { t } from 'i18next';
import { generateId } from '../generateId';
import { log } from '../logger';

export const wikisMenu = (recentWikis: IRecentWikisWithTag[]) => ({
  //   label: t('menu.recentWikis'),
  //   icon: getMenuIcon('recent'),
  label: t('menu.wikis'),
  id: 'recentWikis',
  submenu: [
    ...recentWikis.map(
      ({ path: wikiPath, running }) =>
        ({
          label: running ? wikiPath + ' (Runing)' : wikiPath,
          id: generateId(wikiPath),
          icon: getMenuIcon(running ? 'folder-opened' : 'folder'),
          submenu: [
            {
              label: t('menu.openWiki'),
              icon: getMenuIcon('open'),
              click: async () => {
                if (!fs.existsSync(wikiPath)) {
                  const res = await dialog.showMessageBox({
                    title: t('dialog.open'),
                    message: t('dialog.open2', { folder: wikiPath }),
                    buttons: [t('dialog.confirm'), t('dialog.cancel')],
                    defaultId: 0,
                    cancelId: 1,
                  });
                  if (res.response === 0) {
                    config.set('wikiPath', wikiPath);
                    const res = await initWiki(wikiPath);
                    if (res?.port) {
                      server.currentPort = res.port;
                    }
                  }
                } else {
                  config.set('wikiPath', wikiPath);
                  const res = await initWiki(wikiPath);
                  if (res?.port) {
                    server.currentPort = res.port;
                  }
                }
              },
            },
            {
              label: t('menu.openInBrowser'),
              visible: !!getPortByPath(server.wikiInstances, wikiPath),
              icon: getMenuIcon('web'),
              click: () => {
                const currentPort = getPortByPath(
                  server.wikiInstances,
                  wikiPath
                );
                if (currentPort) {
                  shell.openExternal(`http://localhost:${server.currentPort}`);
                }
              },
            },
            {
              label: t('menu.moveToTrash'),
              visible: !running,
              icon: getMenuIcon('trash'),
              click: async () => {
                // 检查文件是否存在
                const folderExist = fs.existsSync(wikiPath); // 自定义函数检查文件是否存在
                let newRecentWikis;
                if (!folderExist) {
                  newRecentWikis = (config.get('recentWikis') || []).filter(
                    (path: string) => wikiPath !== path
                  );

                  // 更新 recent
                  config.set('recentWikis', newRecentWikis);
                  log.info(wikiPath, 'folder not exist');
                  const item = server.menu.getMenuItemById(
                    generateId(wikiPath)
                  );
                  if (item?.visible) {
                    item.visible = false;
                    Menu.setApplicationMenu(server.menu);
                  }
                  return;
                }

                newRecentWikis = (config.get('recentWikis') || []).filter(
                  (path: string) => wikiPath !== path && wikiPath !== path
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
                  await shell.trashItem(wikiPath); // 移动到垃圾桶
                  config.set('recentWikis', newRecentWikis);
                  const item = server.menu.getMenuItemById(
                    generateId(wikiPath)
                  );
                  if (item?.visible) {
                    item.visible = false;
                    Menu.setApplicationMenu(server.menu);
                  }
                }
              },
            },
          ],
        } as MenuItemConstructorOptions)
    ),
    // { type: 'separator' },
    // {
    //   id: 'clearRecentWikis',
    //   label: t('menu.clearRecentWikis'),
    //   icon: getMenuIcon('clear'),
    //   enabled: recentWikis.length > 0,
    //   click: () => {
    //     const recentMenu = server.menu.getMenuItemById('recentWikis');
    //     config.set('recentWikis', []);
    //     if (recentMenu) {
    //       recentMenu.enabled = false;
    //     }
    //     Menu.setApplicationMenu(server.menu);
    //   },
    // },
  ],
});

function getPortByPath(obj: any, path: string) {
  const entry = Object.entries(obj).find(([port, p]) => p === path);
  return entry ? Number(entry[0]) : null;
}
