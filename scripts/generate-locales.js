const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../src/locales');
const SUPPORTED_LOCALES = ['en-US', 'zh-CN'];

// 统一的翻译对象
const translations = {
  menu: {
    checkUpdate: {
      'en-US': 'Check for Updates',
      'zh-CN': '检查更新',
    },
    langCN: {
      'en-US': 'Enable TiddlyWiki Chinese Language',
      'zh-CN': '启用 TiddlyWiki 中文语言',
    },
    markdown: {
      'en-US': 'Enable Markdown',
      'zh-CN': '启用 Markdown',
    },
    file: {
      'en-US': 'File',
      'zh-CN': '文件',
    },
    settings: {
      'en-US': 'Settings',
      'zh-CN': '设置',
    },
    publish: {
      'en-US': 'Publish',
      'zh-CN': '发布',
    },
    githubConfig: {
      'en-US': 'GitHub Settings',
      'zh-CN': 'GitHub 设置',
    },
    publishToGitHub: {
      'en-US': 'Publish to GitHub',
      'zh-CN': '发布到 GitHub',
    },
    autoStart: {
      'en-US': 'Auto Start',
      'zh-CN': '开机自动启动',
    },
    language: {
      'en-US': 'Language',
      'zh-CN': '语言',
    },
    view: {
      'en-US': 'View',
      'zh-CN': '视图',
    },
    help: {
      'en-US': 'Help',
      'zh-CN': '帮助',
    },
    openExistingWiki: {
      'en-US': 'Open Existing Wiki',
      'zh-CN': '打开已有 Wiki',
    },
    createNewWiki: {
      'en-US': 'Create New Wiki',
      'zh-CN': '新建 Wiki',
    },
    importWiki: {
      'en-US': 'Import Single-file Wiki',
      'zh-CN': '导入单文件 Wiki',
    },
    toggleTitleBar: {
      'en-US': 'Toggle Title Bar',
      'zh-CN': '切换标题栏',
    },
    restart: {
      'en-US': 'Restart App',
      'zh-CN': '重启应用',
    },
    toggleMenuBar: {
      'en-US': 'Toggle Menu Bar',
      'zh-CN': '显示/隐藏菜单栏',
    },
    buildWiki: {
      'en-US': 'Build Wiki',
      'zh-CN': '构建 Wiki',
    },
    openInBrowser: {
      'en-US': 'Open in Browser',
      'zh-CN': '在浏览器中打开',
    },
    openFolder: {
      'en-US': 'Open Wiki Folder',
      'zh-CN': '打开当前 Wiki 文件夹',
    },
    exit: {
      'en-US': 'Exit',
      'zh-CN': '退出',
    },
    devTools: {
      'en-US': 'Open DevTools',
      'zh-CN': '打开开发者工具',
    },
    toggleFullscreen: {
      'en-US': 'Toggle Fullscreen',
      'zh-CN': '切换全屏',
    },
    copy: {
      'en-US': 'Copy',
      'zh-CN': '复制',
    },
    paste: {
      'en-US': 'Paste',
      'zh-CN': '粘贴',
    },
    cut: {
      'en-US': 'Cut',
      'zh-CN': '剪切',
    },
    selectAll: {
      'en-US': 'Select All',
      'zh-CN': '全选',
    },
    reload: {
      'en-US': 'Reload',
      'zh-CN': '刷新',
    },
    about: {
      'en-US': 'About',
      'zh-CN': '关于',
    },
    reportIssue: {
      'en-US': 'Report Issue',
      'zh-CN': '报告问题',
    },
    recentWikis: {
      'en-US': 'Recent Wikis',
      'zh-CN': '最近打开的 Wiki',
    },
    clearRecentWikis: {
      'en-US': 'Clear Recent List',
      'zh-CN': '清除最近记录',
    },
  },
  app: {
    name: {
      'en-US': 'TiddlyWiki App',
      'zh-CN': 'TiddlyWiki App',
    },
    about: {
      'en-US': 'About Wiki',
      'zh-CN': '关于 Wiki',
    },
    version: {
      'en-US': 'Version',
      'zh-CN': '版本',
    },
    configPath: {
      'en-US': 'Config Path',
      'zh-CN': '配置文件路径',
    },
    currentWikiPath: {
      'en-US': 'Current Wiki Path',
      'zh-CN': '当前 Wiki 路径',
    },
    runningPort: {
      'en-US': 'Running Port',
      'zh-CN': '运行端口',
    },
    notRunning: {
      'en-US': 'Not Running',
      'zh-CN': '未启动',
    },
  },
  tray: {
    tooltip: {
      'en-US': 'TiddlyWiki App',
      'zh-CN': 'TiddlyWiki App',
    },
    showWindow: {
      'en-US': 'Show Window',
      'zh-CN': '显示主窗口',
    },
    openInBrowser: {
      'en-US': 'Open in Browser',
      'zh-CN': '在浏览器中打开',
    },
    about: {
      'en-US': 'About',
      'zh-CN': '关于',
    },
    exit: {
      'en-US': 'Exit',
      'zh-CN': '退出',
    },
  },
  dialog: {
    updateDetail: {
      'en-US': 'Update Detail',
      'zh-CN': '更新详情',
    },
    downloadUpdate: {
      'en-US': 'Download Update',
      'zh-CN': '下载更新',
    },
    updateCheck: {
      'en-US': 'Update Check',
      'zh-CN': '检查更新',
    },
    updateAvailable: {
      'en-US': 'Update Available',
      'zh-CN': '发现新版本',
    },
    newVersion: {
      'en-US': 'New version v{{version}} is available',
      'zh-CN': '发现新版本 v{{version}}',
    },
    downloading: {
      'en-US': 'Downloading update...',
      'zh-CN': '正在下载更新...',
    },
    updateReady: {
      'en-US': 'Update Ready',
      'zh-CN': '更新已就绪',
    },
    updateReadyMessage: {
      'en-US':
        'Version v{{version}} has been downloaded. Restart now to install?',
      'zh-CN': '新版本 v{{version}} 已下载完成，是否立即重启应用？',
    },
    updateError: {
      'en-US': 'Update failed: {{message}}',
      'zh-CN': '更新失败：{{message}}',
    },
    checkingUpdate: {
      'en-US': 'Checking for updates...',
      'zh-CN': '正在检查更新...',
    },
    noUpdate: {
      'en-US': 'You are using the latest version',
      'zh-CN': '当前已是最新版本',
    },
    restartNow: {
      'en-US': 'Restart Now',
      'zh-CN': '立即重启',
    },
    later: {
      'en-US': 'Later',
      'zh-CN': '稍后',
    },
    githubConfig: {
      'en-US': 'GitHub Configuration',
      'zh-CN': 'GitHub 配置',
    },
    githubConfigMessage: {
      'en-US': 'Current GitHub Configuration:',
      'zh-CN': '当前 GitHub 配置信息：',
    },
    notSet: {
      'en-US': 'Not Set',
      'zh-CN': '未设置',
    },
    modify: {
      'en-US': 'Modify',
      'zh-CN': '修改',
    },
    githubToken: {
      'en-US': 'GitHub Token',
      'zh-CN': 'GitHub Token',
    },
    githubOwner: {
      'en-US': 'Repository Owner',
      'zh-CN': '仓库所有者',
    },
    githubRepo: {
      'en-US': 'Repository Name',
      'zh-CN': '仓库名称',
    },
    githubBranch: {
      'en-US': 'Branch Name',
      'zh-CN': '分支名称',
    },
    enterGithubToken: {
      'en-US': 'Please enter GitHub Token',
      'zh-CN': '请输入 GitHub Token',
    },
    enterGithubOwner: {
      'en-US': 'Please enter repository owner',
      'zh-CN': '请输入仓库所有者',
    },
    enterGithubRepo: {
      'en-US': 'Please enter repository name',
      'zh-CN': '请输入仓库名称',
    },
    enterGithubBranch: {
      'en-US': 'Please enter branch name',
      'zh-CN': '请输入分支名称',
    },
    success: {
      'en-US': 'Success',
      'zh-CN': '成功',
    },
    githubConfigSuccess: {
      'en-US': 'GitHub configuration has been updated',
      'zh-CN': 'GitHub 配置已更新',
    },
    selectNewWikiFolder: {
      'en-US': 'Select New Wiki Folder',
      'zh-CN': '选择新建 Wiki 的文件夹',
    },
    selectNewWikiFolderMessage: {
      'en-US': 'Please select an empty folder for the new Wiki',
      'zh-CN': '请选择一个空文件夹来创建新的 Wiki',
    },
    folderNotEmpty: {
      'en-US': 'Selected folder is not empty, please select an empty folder',
      'zh-CN': '所选文件夹不为空，请选择一个空文件夹',
    },
    noTiddlyWikiInfo: {
      'en-US':
        'Selected folder is not a valid TiddlyWiki folder, please ensure it contains tiddlywiki.info file',
      'zh-CN':
        '所选文件夹不是有效的 TiddlyWiki 文件夹，请确保文件夹中包含 tiddlywiki.info 文件',
    },
    invalidFolderName: {
      'en-US':
        'Cannot select folder named "tiddlers", please choose another folder',
      'zh-CN': '不能选择名为 "tiddlers" 的文件夹，请选择其他文件夹',
    },
    selectWikiFolder: {
      'en-US': 'Select Wiki Folder',
      'zh-CN': '选择 Wiki 文件夹',
    },
    selectWikiFolderMessage: {
      'en-US': 'Please select a folder for Wiki storage',
      'zh-CN': '请选择一个文件夹作为 Wiki 的存储位置',
    },
    selectHtmlFile: {
      'en-US': 'Select TiddlyWiki HTML File',
      'zh-CN': '选择 TiddlyWiki HTML 文件',
    },
    htmlFilter: {
      'en-US': 'TiddlyWiki HTML',
      'zh-CN': 'TiddlyWiki HTML',
    },
    selectImportFolder: {
      'en-US': 'Select Import Target Folder',
      'zh-CN': '选择导入目标文件夹',
    },
    selectImportFolderMessage: {
      'en-US': 'Please select a target folder to import the Wiki',
      'zh-CN': '请选择要将 Wiki 导入到的目标文件夹',
    },
    importSuccess: {
      'en-US': 'Import Success',
      'zh-CN': '导入成功',
    },
    importSuccessMessage: {
      'en-US':
        'Single-file Wiki has been successfully imported to Node.js version',
      'zh-CN': '单文件 Wiki 已成功导入到 Node.js 版本',
    },
    buildComplete: {
      'en-US': 'Build Complete',
      'zh-CN': '构建完成',
    },
    buildCompleteMessage: {
      'en-US': 'Wiki build completed, preview in browser?',
      'zh-CN': 'Wiki 已构建完成，是否在浏览器中预览？',
    },
    preview: {
      'en-US': 'Preview',
      'zh-CN': '预览',
    },
    showInFolder: {
      'en-US': 'Reveal in File Explorer',
      'zh-CN': '在文件资源管理器中显示',
    },
    // 添加 GitHub 相关的翻译
    github: {
      fileNotExist: {
        'en-US': 'index.html file does not exist',
        'zh-CN': 'index.html 文件不存在',
      },
      buildFirst: {
        'en-US': 'Please build the file first',
        'zh-CN': '请先构建文件',
      },
      uploadSuccess: {
        'en-US': 'Published Successfully',
        'zh-CN': '发布成功',
      },
      clickToView: {
        'en-US': 'Click to view GitHub Pages',
        'zh-CN': '点击查看 GitHub Pages',
      },
      apiError: {
        'en-US': 'GitHub API Error',
        'zh-CN': 'GitHub API 错误',
      },
    },
    confirm: {
      'en-US': 'Confirm',
      'zh-CN': '确定',
    },
    cancel: {
      'en-US': 'Cancel',
      'zh-CN': '取消',
    },
    close: {
      'en-US': 'Close',
      'zh-CN': '关闭',
    },
    error: {
      'en-US': 'Error',
      'zh-CN': '错误',
    },
    buildError: {
      'en-US': 'Failed to build Wiki: {{message}}',
      'zh-CN': '构建 Wiki 失败：{{message}}',
    },
    initError: {
      'en-US': 'Failed to initialize Wiki: {{message}}',
      'zh-CN': '初始化 Wiki 失败：{{message}}',
    },
    importError: {
      'en-US': 'Import failed: {{message}}',
      'zh-CN': '导入失败：{{message}}',
    },
  },
  log: {
    startBuild: {
      'en-US': 'Start building',
      'zh-CN': '开始构建',
    },
    startInit: {
      'en-US': 'Start initialization',
      'zh-CN': '开始初始化',
    },
    finishInit: {
      'en-US': 'Initialization complete',
      'zh-CN': '初始化完成',
    },
    startImport: {
      'en-US': 'Start importing single-file Wiki',
      'zh-CN': '开始导入单文件 Wiki',
    },
    sameFolder: {
      'en-US': 'Already the current open Wiki folder',
      'zh-CN': '已经是当前打开的 Wiki 文件夹',
    },
  },
  settings: {
    languageChanged: {
      'en-US': 'Language Changed',
      'zh-CN': '语言已更改',
    },
    settingChanged: {
      'en-US': 'setting has changed',
      'zh-CN': '设置已更改',
    },
    restartTips: {
      'en-US':
        'Language settings have been changed, some changes may require a restart to take effect',
      'zh-CN': '语言设置已更改，部分更改可能需要重启应用后生效',
    },
  },
};

// 将统一格式转换为单语言格式
function extractLocale(obj, locale) {
  const result = {};

  function extract(src, target) {
    for (const key in src) {
      if (typeof src[key] === 'object') {
        if (src[key][locale]) {
          target[key] = src[key][locale];
        } else {
          target[key] = {};
          extract(src[key], target[key]);
        }
      }
    }
  }

  extract(obj, result);
  return result;
}

// 生成翻译文件
function generateLocales() {
  ensureDirectoryExists(LOCALES_DIR);

  SUPPORTED_LOCALES.forEach((locale) => {
    const localeDir = path.join(LOCALES_DIR, locale);
    ensureDirectoryExists(localeDir);

    const localeTranslations = extractLocale(translations, locale);

    fs.writeFileSync(
      path.join(localeDir, 'translation.json'),
      JSON.stringify(localeTranslations, null, 2)
    );
  });

  console.log('Locales generated successfully!');
}

// 确保目录存在
function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

generateLocales();
