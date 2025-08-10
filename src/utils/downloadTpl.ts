// @TODO: 缓存转换的文件夹, 使用模板的时候直接复制文件夹即可
import { Notification, app, net } from 'electron';
import path from 'path';
import fs from 'fs';
// const { TiddlyWiki } = require('tiddlywiki');
const tempDir = app.getPath('temp'); // 获取系统的临时目录
const tempHTMLFolder = (template: string) => path.join(tempDir, template);

import { log } from '@/utils/logger';
import { shell } from 'electron';
import { dynamicWiki } from './tiddlywiki';
const cacheDuration = 7 * 24 * 60 * 60 * 1000; // 24小时

export const downloadTpl = async (
  tpl: [content: string, label: string],
  cbl: Function,
  notify: Notification
) => {
  const content = tpl[1];
  const label = tpl[0];
  const filePath = path.join(tempDir, `${label}.html`);
  const labelHTMLDir = tempHTMLFolder(label);

  // 检查文件是否存在且是否过期
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const lastModified = stats.mtime.getTime();
      const currentTime = Date.now();

      // 如果文件在24小时内修改过，则直接复用缓存
      if (currentTime - lastModified < cacheDuration) {
        log.log(`${filePath} template is still valid, using cached version.`);
        if (!fs.existsSync(labelHTMLDir)) {
          await convertHTML2Folder(label, filePath, notify, cbl);
        } else {
          cbl(filePath);
        }
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
        notify.show();

        response.on('data', (chunk) => {
          data += chunk.toString();
        });

        response.on('end', () => {
          // 使用流式写入避免卡顿 ??
          const writeStream = fs.createWriteStream(filePath, 'utf-8');
          writeStream.write(data);
          writeStream.end();

          writeStream.on('finish', async () => {
            await convertHTML2Folder(label, filePath, notify, cbl),
              log.log(`${filePath} template has downloaded!`);
          });

          writeStream.on('error', (error) => {
            log.error('写入文件时出错:', error);
            notify.close();
          });
        });
      });

      request.on('error', (error) => {
        log.error('下载失败:', error);
        notify.close();
      });

      request.end();
    }
  } catch (error) {
    log.error('下载失败:', error);
  }
};

export const capitalizeWords = (str: string) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

async function convertHTML2Folder(
  label: string,
  filePath: string,
  notify: Notification,
  cbl?: Function
) {
  // 转换文件夹
  const { boot } = dynamicWiki.TiddlyWiki();
  const labelHTMLDir = tempHTMLFolder(label);
  if (fs.existsSync(labelHTMLDir)) {
    await shell.trashItem(labelHTMLDir);
  }
  fs.mkdirSync(labelHTMLDir);

  boot.argv = [
    '--load',
    filePath,
    '--savewikifolder',
    labelHTMLDir,
    // '--verbose',
  ];

  boot.boot(() => {
    log.info(label, 'convert successfully');
    typeof cbl === 'function' && cbl(filePath);
    setTimeout(() => {
      notify.close();
    }, 600);
  });
}
