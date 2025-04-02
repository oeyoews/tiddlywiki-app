import {
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';
import { getFolderIcon, getMenuIcon } from '@/utils/icon';
import { t } from 'i18next';
import { TPlatform } from '@/main';

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
      icon: getMenuIcon('gear'),
      click: () => {
        const isVisible = win.isMenuBarVisible();
        win.setMenuBarVisibility(!isVisible);
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
    { type: 'separator' },
    {
      label: t('menu.toggleFullscreen'),
      icon: getMenuIcon('screens'),
      accelerator: 'F11',
      role: 'togglefullscreen',
    },
    {
      label: t('menu.reload'),
      icon: getMenuIcon('reload'),
      role: 'reload',
      accelerator: 'CmdOrCtrl+R',
    },
  ];

  // 如果右键点击的是图片，添加复制图片选项
  if (params.mediaType === 'image') {
    if (['windows', 'macOs'].includes(TPlatform)) {
      menus.push({
        label: t('menu.minifyImage'),
        icon: getMenuIcon('panda'),
        click: () => {
          win.webContents.send('title-fetched', {
            x: params.x,
            y: params.y,
          });
        },
      });
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
