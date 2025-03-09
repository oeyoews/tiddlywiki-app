const { shell, dialog } = require('electron');
const fs = require('fs');

/**
 * 将 Wiki 发布到 GitHub Pages
 * @param {Object} options - 发布配置选项
 * @param {string} options.wikiFolder - Wiki 文件夹路径
 * @param {string} options.GITHUB_TOKEN - GitHub 个人访问令牌
 * @param {string} options.owner - 仓库所有者用户名
 * @param {string} options.repo - 目标仓库名称
 * @param {string} [options.branch='main'] - 目标分支名称，默认为 main
 * @param {string} [options.COMMIT_MESSAGE='Deploy to GitHub Pages'] - 提交消息
 * @returns {Promise} 上传操作的 Promise
 */
async function saveToGitHub({
  owner,
  repo,
  branch = 'main',
  wikiFolder,
  GITHUB_TOKEN,
  COMMIT_MESSAGE = 'Deploy to GitHub Pages ' + new Date().toLocaleDateString(),
}) {
  const pageSite = `https://${owner}.github.io/${repo}`;
  // @see: https://github.com/settings/tokens
  const FILE_PATH = wikiFolder + '/output/index.html';
  if (!fs.existsSync(FILE_PATH)) {
    dialog.showMessageBox({
      type: 'error',
      title: '错误',
      message: 'index.html 文件不存在',
      detail: '请先构建文件',
    });
    return;
  }

  const baseURL = 'https://api.github.com/repos';
  const url = baseURL + `/${owner}/${repo}/contents/index.html`;

  async function getFileSha() {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.sha; // 返回文件的 SHA 值
    }

    return null; // 文件不存在，返回 null
  }

  async function uploadToGHPages() {
    const content = fs.readFileSync(FILE_PATH, 'base64');

    const body = {
      message: COMMIT_MESSAGE,
      content,
      branch,
    };
    const sha = await getFileSha();
    if (sha) {
      body.sha = sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('File uploaded to GitHub Pages:', data.content.html_url);
    // 点击可以跳转到 GitHub Pages
    dialog
      .showMessageBox({
        type: 'info',
        title: '提示',
        message: '文件已上传到 GitHub Pages',
        detail: '点击可以跳转到 GitHub Pages',
        buttons: ['查看', '关闭'],
        cancelId: 1,
      })
      .then((result) => {
        if (result.response === 0) {
          // 打开链接
          // https://oeyoews.github.io/tiddlywiki-app-website-deploy/
          shell.openExternal(pageSite);
        }
      });
  }

  return uploadToGHPages();
}

module.exports = saveToGitHub;
