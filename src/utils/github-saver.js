const { Notification, shell, dialog } = require('electron');
const fs = require('fs');
import { i18next } from '../i18n/index.js';
const { t } = i18next;

const log = require('electron-log/main');

/**
 * 将 Wiki 发布到 GitHub Pages
 * @param {Object} options - 发布配置选项
 * @param {string} options.wikiFolder - Wiki 文件夹路径
 * @param {string} options.GITHUB_TOKEN - GitHub 个人访问令牌
 * @param {string} options.owner - 仓库所有者用户名
 * @param {string} options.repo - 目标仓库名称
 * @param {string} [options.branch='main'] - 目标分支名称，默认为 main
 * @param {string} [options.COMMIT_MESSAGE='Deploy to GitHub Pages'] - 提交消息
 * @param {Object} options.mainWindow - 主窗口对象
 * @returns {Promise} 上传操作的 Promise
 */
async function saveToGitHub({
  owner,
  repo,
  branch = 'main',
  wikiFolder,
  GITHUB_TOKEN,
  // + new Date().toLocaleTimeString(),
  COMMIT_MESSAGE = 'Saved by TiddlyWiki App ',
  mainWindow, // 添加 mainWindow 参数
}) {
  log.info('begine to save tiddlywiki html to github pages...');
  const pageSite = `https://${owner}.github.io/${repo}`;
  // @see: https://github.com/settings/tokens
  const FILE_PATH = wikiFolder + '/output/index.html';
  if (!fs.existsSync(FILE_PATH)) {
    dialog.showMessageBox({
      type: 'error',
      title: 'Error',
      message: t('github.error.fileNotExist'),
      detail: t('github.error.buildFirst'),
    });
    return;
  }

  if (!owner || !repo || !GITHUB_TOKEN) {
    // dialog.showMessageBox({
    //   type: 'info',
    // })
    log.info('github config not corrected');
    return;
  }

  const baseURL = 'https://api.github.com/repos';
  const url = baseURL + `/${owner}/${repo}/contents/index.html`;

  async function getFileSha() {
    try {
      log.info('begin getfilesha ...', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        log.info('github file sha', data.sha);
        return data.sha; // 返回文件的 SHA 值
      } else {
        log.error('response has crashed', response);
      }

      return null; // 文件不存在，返回 null
    } catch (e) {
      log.error('getfilesha', e);
    }
  }

  async function uploadToGHPages() {
    try {
      const content = fs.readFileSync(FILE_PATH, 'base64');

      // 开始上传时显示进度条
      if (mainWindow) {
        mainWindow.setProgressBar(0.2);
      }

      const body = {
        message: COMMIT_MESSAGE,
        content,
        branch,
      };
      const sha = await getFileSha();
      if (sha) {
        body.sha = sha;
      }

      // 上传过程中更新进度
      if (mainWindow) {
        mainWindow.setProgressBar(0.6);
      }
      log.info('github-saver url is (start)', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      log.info('github-saver url is (uploading)', url);

      // 上传完成，移除进度条
      if (mainWindow) {
        mainWindow.setProgressBar(-1);
      }

      if (!response.ok) {
        throw new Error(
          `${t('github.upload.apiError')}: ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('File uploaded to GitHub Pages:', data.content.html_url);
      new Notification({
        title: t('dialog.github.uploadSuccess'),
        body: t('dialog.github.clickToView'),
        silent: false,
      })
        .on('click', () => {
          shell.openExternal(pageSite);
        })
        .show();
    } catch (error) {
      // 发生错误时移除进度条
      if (mainWindow) {
        mainWindow.setProgressBar(-1);
      }
      throw error;
    }
  }

  return uploadToGHPages();
}

// module.exports = saveToGitHub;
export default saveToGitHub;
