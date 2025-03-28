import { config } from '@/utils/config';
import path from 'path';
import { type BrowserWindow } from 'electron';

import { log } from '@/utils/logger';

process.env.APP_ROOT = path.join(__dirname, '../..');
process.env.DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : process.env.DIST;

const render = path.join(process.env.DIST, 'renderer/index.js');
// const swal = path.join(process.env.VITE_PUBLIC, 'lib/sweetalert.min.js');
const autocorrectLib = path.join(
  process.env.VITE_PUBLIC,
  'lib/autocorrect.min.js'
);

export const injectScript = (win: BrowserWindow) => {
  log.info('begin inject script');
  const scripts = [render];

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
