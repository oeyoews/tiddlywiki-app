import path from 'path';
import { app } from 'electron';

export const log = require('electron-log/main');

const date = new Date().toISOString().split('T').shift()!.replace('-', '/'); // 替换第一个-

export function logInit() {
  log.transports.file.resolvePathFn = () =>
    path.join(app.getPath('logs'), date, `main.log`);
}
