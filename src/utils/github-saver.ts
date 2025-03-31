// @ts-nocheck
import { Notification, shell, dialog, BrowserWindow, net } from 'electron';
import fs from 'fs';
import { log } from '@/utils/logger';
import { getMenuIcon } from './icon';
import { t } from 'i18next';

let githubNotify: Notification;

/**
 * 将 Wiki 发布到 GitHub Pages
 * @param {Object} options - 发布配置选项
 * @param {string} options.wikiFolder - Wiki 文件夹路径
 * @param {string} options.GITHUB_TOKEN - GitHub 个人访问令牌
 * @param {string} options.owner - 仓库所有者用户名
 * @param {string} options.repo - 目标仓库名称
 * @param {string} [options.branch='main'] - 目标分支名称，默认为 main
 * @param {string} [options.COMMIT_MESSAGE='Deploy to GitHub Pages'] - 提交消息
 * @param {Object} options.win - 主窗口对象
 * @returns {Promise} 上传操作的 Promise
 */
async function saveToGitHub({
  owner,
  repo,
  branch = 'main',
  wikiFolder,
  GITHUB_TOKEN,
  COMMIT_MESSAGE = 'Saved by TiddlyWiki App ',
  win,
}: ISaver & { win: BrowserWindow }) {
  log.info('begin to save tiddlywiki html to github pages...');
  const pageSite = `https://${owner}.github.io/${repo}`;
  const FILE_PATH = wikiFolder + '/output/index.html';

  if (!fs.existsSync(FILE_PATH)) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: t('dialog.github.fileNotExist'),
      detail: t('dialog.github.buildFirst'),
    });
    return;
  }

  if (!owner || !repo || !GITHUB_TOKEN) {
    log.info('GitHub config is not correct');
    // 跳转 config tiddler
    win.webContents.send('config-github');
    return;
  }

  const baseURL = 'https://api.github.com/repos';
  const url = `${baseURL}/${owner}/${repo}/contents/index.html`;

  async function getFileSha() {
    return new Promise((resolve, reject) => {
      log.info('begin getfilesha ...', url);

      const request = net.request({
        method: 'GET',
        url,
        headers: {
          Authorization: `Basic ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      request.on('response', (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const data = JSON.parse(body);
              log.info('GitHub file SHA:', data.sha);
              resolve(data.sha);
            } catch (error) {
              log.error('Error parsing SHA response', error);
              reject(null);
            }
          } else {
            log.error('Failed to get SHA:', response.statusCode);
            resolve(null);
          }
        });
      });

      request.on('error', (error) => {
        log.error('getfilesha error', error);
        reject(null);
      });

      request.end();
    });
  }

  async function uploadToGHPages() {
    try {
      const content = fs.readFileSync(FILE_PATH, 'base64');

      if (win) win.setProgressBar(0.2);

      const body = {
        message: COMMIT_MESSAGE,
        content,
        branch,
      };

      const sha = await getFileSha();
      if (sha) {
        body.sha = sha;
      }

      if (win) win.setProgressBar(0.6);
      log.info('github-saver url is (start)', url);

      return new Promise((resolve, reject) => {
        const request = net.request({
          method: 'PUT',
          url,
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        });

        request.on('response', (response) => {
          let responseBody = '';

          response.on('data', (chunk) => {
            responseBody += chunk;
          });

          response.on('end', () => {
            if (response.statusCode === 200 || response.statusCode === 201) {
              const data = JSON.parse(responseBody);
              log.info('File uploaded to GitHub Pages:', data.content.html_url);

              if (!githubNotify) {
                githubNotify = new Notification({
                  title: t('dialog.github.uploadSuccess'),
                  body: t('dialog.github.clickToView'),
                  icon: getMenuIcon('gitHub', 256),
                  silent: false,
                });
              }
              githubNotify
                .on('click', () => {
                  shell.openExternal(pageSite);
                })
                .show();

              resolve(data);
            } else {
              log.error('Upload failed:', responseBody);
              reject(
                new Error(
                  `${t('dialog.github.apiError')}: ${response.statusCode}`
                )
              );
            }

            if (win) win.setProgressBar(-1);
          });
        });

        request.on('error', (error) => {
          log.error('Upload request error:', error);
          if (win) win.setProgressBar(-1);
          reject(error);
        });

        request.write(JSON.stringify(body));
        request.end();
      });
    } catch (error) {
      if (win) win.setProgressBar(-1);
      log.error('Upload failed:', error);
      throw error;
    }
  }

  return uploadToGHPages();
}

export default saveToGitHub;
