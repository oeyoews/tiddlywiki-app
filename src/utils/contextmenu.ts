import { t } from '@/i18n';
import path from 'path';
import fs from 'fs';
import {
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
  shell,
} from 'electron';
import { getMenuIcon } from './icon';
import { config } from './config';
import { log } from './logger';

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
      // acceleratorWorksWhenHidden: false,
    },
    {
      label: t('menu.openTid'),
      icon: getMenuIcon('File'),
      visible: !params?.selectionText.startsWith('$'),
      click: () => {
        console.log(params.selectionText, 'params');
        const tidPath = path.join(
          config.get('wikiPath'),
          'tiddlers',
          `${params.selectionText}.tid`
        );
        if (fs.existsSync(tidPath)) {
          log.info('open file', tidPath);
          shell.showItemInFolder(tidPath);
        } else {
          log.error(tidPath, 'not exit');
        }
      },
      enabled: params.editFlags.canCopy,
    },
    {
      label: t('menu.copy'),
      icon: getMenuIcon('copy'),
      role: 'copy',
      accelerator: 'CmdOrCtrl+C',
      enabled: params.editFlags.canCopy,
    },
    {
      label: t('menu.paste'),
      icon: getMenuIcon('paste'),
      role: 'paste',
      enabled: params.editFlags.canPaste,
    },
    {
      label: t('menu.cut'),
      role: 'cut',
      icon: getMenuIcon('cut'),
      enabled: params.editFlags.canCut,
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
