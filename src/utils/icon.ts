import path from 'path';
import { nativeImage, nativeTheme } from 'electron';
import { config } from '@/utils/config';
import { getPlatform } from '@/utils/getPlatform';

process.env.APP_ROOT = path.join(__dirname, '../..');
process.env.DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : process.env.DIST;

const iconPath = process.env.VITE_PUBLIC
  ? 'assets/tray-icon.png'
  : 'assets/tray-icon-dev.png';

export const appIcon = path.join(process.env.VITE_PUBLIC, iconPath);
const enableIcon = config.get('icon');
export const getMenuIcon = (name: IMenuIcon, size?: number) => {
  if (!enableIcon) return;
  const iconPath = path.join(
    process.env.VITE_PUBLIC!,
    'assets/menu',
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

export const getFolderIcon = () => getMenuIcon(`folder-${getPlatform()}`);
