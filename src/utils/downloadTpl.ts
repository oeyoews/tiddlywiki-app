import { app, net } from 'electron';
import path from 'path';
import fs from 'fs';
const tempDir = app.getPath('temp'); // 获取系统的临时目录

import { log } from '@/utils/logger';

// 缓存
export const downloadTpl = (
  tpl: [content: string, label: string],
  cbl: Function
) => {
  const content = tpl[1];
  const label = tpl[0];
  const filePath = path.join(tempDir, `${label}.html`);
  try {
    if (content.startsWith('http')) {
      const request = net.request(content);

      log.log(`${content} template is downloading !`);
      request.on('response', (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk.toString();
        });

        response.on('end', () => {
          fs.writeFileSync(filePath, data, 'utf-8');
          cbl(filePath);
          log.log(`${filePath} template has donwloaded !`);
        });
      });

      request.on('error', (error) => {
        console.error('下载失败:', error);
      });

      request.end();
    }
  } catch (error) {
    console.error('下载失败:', error);
  }
};

export const capitalizeWords = (str: string) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());
