import {
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';
import { getFolderIcon, getMenuIcon } from '@/utils/icon';
import { t } from 'i18next';
import { TPlatform } from '@/main';
import { server } from '.';
import { getAllLocalIPv4Addresses } from './getHost';
import { config } from './config';
import { getPlatform } from './getPlatform';

/**
 * 注册右键菜单
 * @param {*} params
 * @param {*} win
 */
export const registerContextMenu = (
  params: Electron.ContextMenuParams,
  win: BrowserWindow
) => {
  const menus: MenuItemConstructorOptions[] = [
    {
      accelerator: 'Alt+M',
      label: t('menu.toggleMenuBar'),
      visible: !params.isEditable && getPlatform() != 'macOs',
      icon: getMenuIcon('gear'),
      click: () => {
        const isVisible = win.isMenuBarVisible();
        win.setMenuBarVisibility(!isVisible);
      },
    },
    {
      label: t('menu.searchText', { text: params.selectionText.slice(0, 35) }),
      icon: getMenuIcon('searchGoogle'),
      click: () => {
        shell.openExternal(
          `https://google.com/search?q=${params.selectionText}`
        );
      },
      visible: params.editFlags.canCopy,
    },
    // TODO: add delete/edit btn
    {
      label: t('menu.copy'),
      icon: getMenuIcon('copy'),
      role: 'copy',
      accelerator: 'CmdOrCtrl+C',
      visible: params.editFlags.canCopy,
    },
    {
      label: t('menu.paste'),
      icon: getMenuIcon('paste'),
      accelerator: 'CmdOrCtrl+V',
      role: 'paste',
      // enabled: params.editFlags.canPaste,
      visible: params.editFlags.canPaste,
    },
    {
      label: t('menu.cut'),
      role: 'cut',
      accelerator: 'CmdOrCtrl+X',
      icon: getMenuIcon('cut'),
      visible: params.editFlags.canCut,
    },
    {
      label: t('menu.toggleFullscreen'),
      icon: getMenuIcon('screens'),
      accelerator: 'F11',
      role: 'togglefullscreen',
      visible: !params.isEditable,
    },
    {
      label: t('menu.reload'),
      icon: getMenuIcon('reload'),
      role: 'reload',
      visible: !params.isEditable,
      accelerator: 'CmdOrCtrl+R',
    },
  ];

  const openMenu: MenuItemConstructorOptions[] = [
    { type: 'separator' },
    {
      label: t('menu.openInBrowser'),
      icon: getMenuIcon('web'),
      accelerator: 'CmdOrCtrl+Shift+O',
      click: () => {
        if (server.currentPort) {
          shell.openExternal(`http://localhost:${server.currentPort}`);
        }
      },
    },
    {
      label: t('menu.showQRCode'),
      icon: getMenuIcon('qrcode'),
      visible: !!config.get('lan'),
      click: () => {
        const host = getAllLocalIPv4Addresses(); // 获取局域网地址
        server.win.webContents.send('show-qrcode', {
          host: host.pop(),
          port: server.currentPort,
          message: t('dialog.scalQRCode'),
        });
      },
    },
    {
      label: t('menu.openTid'),
      icon: getFolderIcon(),
      click: () => {
        win.webContents.send('update-tid', { x: params.x, y: params.y });
      },
    },
    {
      label: t('menu.openVSCode'),
      icon: getMenuIcon('vscode'),
      click: () => {
        win.webContents.send('update-tid-vscode', { x: params.x, y: params.y });
      },
    },
  ];
  if (!params.isEditable) {
    menus.push(...openMenu);
  }

  // 如果右键点击的是图片，添加复制图片选项
  if (params.mediaType === 'image') {
    if (['windows', 'macOs'].includes(TPlatform)) {
      menus.push(
        {
          type: 'separator',
        },
        {
          label: t('menu.minifyImage'),
          icon: getMenuIcon('panda'),
          click: () => {
            win.webContents.send('title-fetched', {
              x: params.x,
              y: params.y,
            });
          },
        }
      );
    }
    menus.push({
      label: t('menu.copyImage'),
      icon: getMenuIcon('image'),
      click: () => {
        win.webContents.copyImageAt(params.x, params.y);
      },
    });
  }
  const contextMenu = Menu.buildFromTemplate(menus);
  contextMenu.popup();
};
