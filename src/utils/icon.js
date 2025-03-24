import path from 'path';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

export const iconPath = path.join(
  process.env.VITE_PUBLIC,
  '../assets/tray-icon.png'
);
export const iconPathDev = path.join(
  process.env.VITE_PUBLIC,
  '../assets/tray-icon-dev.png'
);
