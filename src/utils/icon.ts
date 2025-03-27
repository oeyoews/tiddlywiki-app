import path from 'path';
import { app, nativeImage, nativeTheme } from 'electron';
import { config } from '@/utils/config';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const iconPath = app.isPackaged
  ? '../assets/tray-icon.png'
  : '../assets/tray-icon-dev.png';

export const appIcon = path.join(process.env.VITE_PUBLIC, iconPath);
const enableIcon = config.get('icon');
export const getMenuIcon = (name: IMenuIcon, size?: number) => {
  if (!enableIcon) return;
  const iconPath = path.join(
    process.env.VITE_PUBLIC!,
    '../assets/menu',
    `${name}.png`
  );
  return nativeImage
    .createFromPath(iconPath)
    .resize({ width: size || 16, height: size || 16 }); // 调整图标大小
};

export const twImage = (size: number = 16) =>
  nativeImage.createFromPath(appIcon).resize({ width: size, height: size }); // 调整图标大小

export const getAppIcon = (
  size: number = 512,
  darkmode: 'auto' | 'tw-dark' | 'tw-light' = 'auto'
) => {
  if (darkmode !== 'auto') {
    return getMenuIcon(darkmode, size);
  } else {
    return nativeTheme.shouldUseDarkColors
      ? getMenuIcon('tw-dark', size)
      : getMenuIcon('tw-light', size);
  }
};
