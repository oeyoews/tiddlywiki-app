import { config } from '@/utils/config';
import path from 'path';
import { type BrowserWindow } from 'electron';

import { log } from '@/utils/logger';
import { processEnv } from '@/main';

export const injectRenderScript = (win: BrowserWindow, cbl: Function) => {
  const render = path.join(processEnv.VITE_DIST, 'renderer/index.js');

  win.webContents.executeJavaScript(`
    (() => {
        const script = document.createElement('script');
        script.src = 'file://${render.replace(/\\/g, '/')}';
        document.body.appendChild(script);
  })()
    `);
  log.info('injected renderjs');
  if (typeof cbl === 'function') {
    cbl();
  }
};

export const injectScript = (win: BrowserWindow) => {
  // const render = path.join(processEnv.VITE_DIST, 'renderer/index.js');
  const confetti = path.join(processEnv.VITE_PUBLIC, 'lib', 'confetti.min.js');
  const qrcode = path.join(processEnv.VITE_PUBLIC, 'lib', 'qrcode.min.js');
  // const swal = path.join(process.env.VITE_PUBLIC, 'lib/sweetalert.min.js');
  const autocorrectLib = path.join(
    processEnv.VITE_PUBLIC,
    'lib/autocorrect.min.js'
  );

  log.info('Begin inject script');
  const scripts = [confetti, qrcode];

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
