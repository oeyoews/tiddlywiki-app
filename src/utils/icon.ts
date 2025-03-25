import path from 'path';
import { app, nativeImage } from 'electron';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const iconPath = app.isPackaged
  ? '../assets/tray-icon.png'
  : '../assets/tray-icon-dev.png';

export const appIcon = path.join(process.env.VITE_PUBLIC, iconPath);
export const getMenuIcon = (name: IMenuIcon) => {
  const iconPath = path.join(
    process.env.VITE_PUBLIC!,
    '../assets/menu',
    `${name}.png`
  );
  return nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }); // 调整图标大小
};
