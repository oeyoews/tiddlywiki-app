import { app, net } from 'electron';
import path from 'path';
import fs from 'fs';
const tempDir = app.getPath('temp'); // 获取系统的临时目录

import { log } from '@/utils/logger';
const cacheDuration = 24 * 60 * 60 * 1000; // 24小时

export const downloadTpl = (
  tpl: [content: string, label: string],
  cbl: Function
) => {
  const content = tpl[1];
  const label = tpl[0];
  const filePath = path.join(tempDir, `${label}.html`);

  // 检查文件是否存在且是否过期
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const lastModified = stats.mtime.getTime();
      const currentTime = Date.now();

      // 如果文件在24小时内修改过，则直接复用缓存
      if (currentTime - lastModified < cacheDuration) {
        log.log(`${filePath} template is still valid, using cached version.`);
        cbl(filePath);
        return;
      } else {
        log.log(`${filePath} template is outdated, downloading again.`);
      }
    }

    // 如果文件不存在或过期，下载新的模板
    if (content.startsWith('http')) {
      const request = net.request(content);
      log.log(`${content} template is downloading!`);

      request.on('response', (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk.toString();
        });

        response.on('end', () => {
          fs.writeFileSync(filePath, data, 'utf-8');
          cbl(filePath);
          log.log(`${filePath} template has downloaded!`);
        });
      });

      request.on('error', (error) => {
        log.error('下载失败:', error);
      });

      request.end();
    }
  } catch (error) {
    log.error('下载失败:', error);
  }
};

export const capitalizeWords = (str: string) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());
