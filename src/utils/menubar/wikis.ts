import { dialog, Menu, shell, type MenuItemConstructorOptions } from 'electron';
import { closeTwServer, initWiki, server } from '@/utils';
import { getFolderIcon, getMenuIcon } from '@/utils/icon';
import fs from 'fs';
import { config } from '@/utils/config';
import { t } from 'i18next';
import { generateId } from '../generateId';
import { log } from '../logger';
import { getAllLocalIPv4Addresses } from '../getHost';

export const wikisMenu = (recentWikis: IWikiMenu[]) => ({
  label: t('menu.wikis'),
  id: 'recentWikis',
  submenu: [
    ...recentWikis.map(
      ({ path: wikiPath, port, isRunning, isCurrentWiki }) =>
        ({
          label: isRunning ? wikiPath + `(${port})` : wikiPath,
          id: generateId(wikiPath),
          icon: getMenuIcon(isRunning ? 'folder-opened' : 'folder'),
          submenu: [
            {
              label: t('menu.openWiki'),
              visible: !isCurrentWiki,
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
              visible: isRunning,
              id: 'open-wiki-in-browser-' + generateId(wikiPath),
              icon: getMenuIcon('web'),
              click: () => {
                const currentPort = getPortByPath(wikiPath);
                if (currentPort) {
                  shell.openExternal(`http://localhost:${currentPort}`);
                }
              },
            },
            {
              label: t('menu.showQRCode'),
              visible: isRunning && config.get('lan'),
              id: 'show-qrcode-' + generateId(wikiPath),
              icon: getMenuIcon('qrcode'),
              click: () => {
                const host = getAllLocalIPv4Addresses(); // 获取局域网地址
                server.win.webContents.send('show-qrcode', {
                  host: host.pop(),
                  port,
                  message: t('dialog.scalQRCode'),
                });
              },
            },
            {
              label: t('menu.openFolder'),
              icon: getFolderIcon(),
              click: () => {
                shell.openPath(wikiPath);
              },
            },
            {
              label: t('menu.stopWiki'),
              visible: !isCurrentWiki && isRunning,
              id: 'stop-wiki-' + generateId(wikiPath),
              icon: getMenuIcon('stop'),
              click: async (menuItem) => {
                // await closeTwServer(generateId(wikiPath));
                closeTwServer(generateId(wikiPath));

                const item = server.menu.getMenuItemById(menuItem.id);
                const openInBrowserItem = server.menu.getMenuItemById(
                  'open-wiki-in-browser-' + generateId(wikiPath)
                );
                const showQRCodeItem = server.menu.getMenuItemById(
                  'show-qrcode-' + generateId(wikiPath)
                );
                if (showQRCodeItem?.visible) {
                  showQRCodeItem.enabled = false;
                }
                if (openInBrowserItem?.visible) {
                  openInBrowserItem.enabled = false;
                }
                if (item?.visible) {
                  item.visible = false;
                  Menu.setApplicationMenu(server.menu);
                }
              },
            },
            {
              label: t('menu.moveToTrash'),
              visible: !isRunning && !isCurrentWiki,
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
                  (path: string) => wikiPath !== path
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
                  log.info('Begin delete folder', wikiPath);
                  // fs.rmSync(label, { force: true, recursive: true }); // NOTE: 永久删除
                  config.set('recentWikis', newRecentWikis);
                  const item = server.menu.getMenuItemById(
                    generateId(wikiPath)
                  );
                  if (item?.visible) {
                    item.visible = false;
                    Menu.setApplicationMenu(server.menu);
                  }
                  // 最后进行回收
                  await shell.trashItem(wikiPath); // 移动到垃圾桶
                  dialog.showMessageBoxSync({
                    title: t('dialog.success'),
                    icon: getMenuIcon('success', 256),
                    message: t('dialog.deleteSuccess'),
                  });
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

function getPortByPath(path: string) {
  const wikiServer = server.twServers.get(generateId(path));
  return wikiServer?.port;
}
