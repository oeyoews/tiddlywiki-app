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
export const registerContextMenu = (params: any, win: BrowserWindow) => {
  const menus: MenuItemConstructorOptions[] = [
    {
      accelerator: 'Alt+M',
      label: t('menu.toggleMenuBar'),
      click: () => {
        const isVisible = win.isMenuBarVisible();
        win.setMenuBarVisibility(!isVisible);
      },
      // acceleratorWorksWhenHidden: false,
    },
    {
      label: t('menu.copy'),
      icon: getMenuIcon('save'),
      role: 'copy',
      accelerator: 'CmdOrCtrl+C',
      enabled: params.editFlags.canCopy,
    },
    {
      label: t('menu.paste'),
      role: 'paste',
      enabled: params.editFlags.canPaste,
    },
    {
      label: t('menu.cut'),
      role: 'cut',
      enabled: params.editFlags.canCut,
    },
    { type: 'separator' },
    {
      label: t('menu.toggleFullscreen'),
      accelerator: 'F11',
      role: 'togglefullscreen',
    },
    {
      label: t('menu.reload'),
      role: 'reload',
      accelerator: 'CmdOrCtrl+R',
    },
  ];

  // 如果右键点击的是图片，添加复制图片选项
  // if (params.mediaType === 'image') {
  //   menus.push({
  //     label: t('menu.copyImage'),
  //     click: () => {
  //       win.webContents.copyImageAt(params.x, params.y);
  //     },
  //   });
  // }
  const contextMenu = Menu.buildFromTemplate(menus);
  contextMenu.popup();
};
