import { t } from '@/i18n';
import {
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
} from 'electron';
import { getMenuIcon } from './icon';

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
      icon: getMenuIcon('settings'),
      click: () => {
        const isVisible = win.isMenuBarVisible();
        win.setMenuBarVisibility(!isVisible);
      },
    },
    {
      label: t('menu.openTid'),
      icon: getMenuIcon('File'),
      click: () => {
        win.webContents.send('update-tid', { x: params.x, y: params.y });
      },
    },
    // TODO: add delete/edit btn
    {
      label: t('menu.copy'),
      icon: getMenuIcon('copy'),
      role: 'copy',
      accelerator: 'CmdOrCtrl+C',
      enabled: params.editFlags.canCopy,
      visible: params.editFlags.canCopy,
    },
    {
      label: t('menu.paste'),
      icon: getMenuIcon('paste'),
      role: 'paste',
      // enabled: params.editFlags.canPaste,
      visible: params.editFlags.canPaste,
    },
    {
      label: t('menu.cut'),
      role: 'cut',
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
