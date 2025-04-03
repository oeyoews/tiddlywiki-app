import { BrowserWindow } from 'electron';
import { config } from './config';

/**
 * 监听并动态更新窗口状态
 * @param {BrowserWindow} win - Electron 窗口实例
 * @param {Function} callback - 状态更新回调函数
 */
export function trackWindowState(win: BrowserWindow) {
  if (!win || !(win instanceof BrowserWindow)) {
    throw new Error('Invalid BrowserWindow instance');
  }

  const updateState = () => {
    const bounds = win.getBounds();
    const state = {
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
      // isMinimized: win.isMinimized(),
    };
    config.set('window', state);
  };

  // 监听窗口变化事件
  win.on('resize', () => updateState());
  win.on('move', updateState);
  win.on('maximize', updateState);
  win.on('unmaximize', updateState);
  win.on('enter-full-screen', updateState);
  win.on('leave-full-screen', updateState);
  // win.on('minimize', updateState);
  // win.on('restore', updateState);
}
