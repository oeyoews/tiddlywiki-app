import path from 'path';
import { app } from 'electron';

export const log = require('electron-log/main');

const logDate = new Date().toISOString().split('T').shift()!.replace('-', '/'); // 替换第一个-
export const logPath = path.join(app.getPath('logs'), logDate, `main.log`);

export function logInit() {
  log.transports.file.resolvePathFn = () => logPath;
}
