import path from 'path';
import { app } from 'electron';
import fs from 'fs/promises';

export const log = require('electron-log/main');

const logDate = new Date().toISOString().split('T').shift()!.replace('-', '/'); // 替换第一个-
export const logPath = path.join(app.getPath('logs'), logDate, `main.log`);

async function cleanupOldLogs() {
  const logsRoot = app.getPath('logs');
  const now = new Date();

  try {
    const yearDirs = await fs.readdir(logsRoot);
    await Promise.all(
      yearDirs.map(async (year) => {
        const yearPath = path.join(logsRoot, year);
        const stat = await fs.stat(yearPath);
        if (!stat.isDirectory()) return;

        const dayDirs = await fs.readdir(yearPath);
        await Promise.all(
          dayDirs.map(async (dayDir) => {
            const fullDirPath = path.join(yearPath, dayDir);
            const stat = await fs.stat(fullDirPath);
            if (!stat.isDirectory()) return;

            const [month, day] = dayDir.split('-');
            const dirDate = new Date(`${year}-${month}-${day}`);
            const diffTime = now.getTime() - dirDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays > 7) {
              await fs.rm(fullDirPath, { recursive: true, force: true });
              console.log(`[Logs Cleaned]: ${fullDirPath}`);
            }
          })
        );
      })
    );
  } catch (err) {
    console.error('Clean Logs Error:', err);
  }
}

export function logInit() {
  log.transports.file.resolvePathFn = () => logPath;
  // 异步不等待
  cleanupOldLogs().then(() => {});
}
