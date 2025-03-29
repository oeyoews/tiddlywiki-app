import path from 'path';
import { nativeImage, nativeTheme } from 'electron';
import { config } from '@/utils/config';
import { getPlatform } from '@/utils/getPlatform';
import { processEnv } from '@/main';

// **缓存对象**（key: `name-size`，value: `nativeImage`）
const iconCache = new Map<string, Electron.NativeImage>();
const enableIcon = config.get('icon');

export const getMenuIcon = (name: IMenuIcon, size: number = 16) => {
  if (!enableIcon) return;

  const cacheKey = `${name}-${size}`;
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }

  const iconPath = path.join(
    processEnv.VITE_PUBLIC,
    'assets/menu',
    `${name}.png`
  );
  const image = nativeImage
    .createFromPath(iconPath)
    .resize({ width: size, height: size });

  // **缓存结果**
  iconCache.set(cacheKey, image);
  return image;
};

export const twImage = (size: number = 16) => getMenuIcon('tw-light', size); // 使用缓存

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

// @ts-ignore
export const getFolderIcon = () => getMenuIcon(`folder-${getPlatform()}`);
