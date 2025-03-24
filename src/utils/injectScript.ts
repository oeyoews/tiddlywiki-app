import { config } from '@/utils/config';
import path from 'path';
import { app, type BrowserWindow } from 'electron';

import { log } from '@/utils/logger';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

const render = path.join(__dirname, '../renderer/index.js');
const swal = path.join(process.env.VITE_PUBLIC, '../lib/sweetalert.min.js');
const autocorrectLib = path.join(
  process.env.VITE_PUBLIC,
  '../lib/autocorrect.min.js'
);

export const injectScript = (win: BrowserWindow) => {
  log.info('begin inject script');
  const scripts = [render, swal];

  if (config.get('autocorrect')) {
    scripts.push(autocorrectLib);
    log.info('Enable autocorrect lib');
  }

  scripts.forEach((src) => {
    win.webContents.executeJavaScript(`
      (() => {
        const script = document.createElement('script');
        script.src = 'file://${src.replace(/\\/g, '/')}';
        document.body.appendChild(script);
      })();
    `);
  });
};
