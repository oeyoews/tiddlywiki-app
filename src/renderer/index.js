// 监听 DOM 加载完成
// document.addEventListener('DOMContentLoaded', () => {
// 	console.log('loaded')
// });

window.confirm = function (message) {
  return window.electronAPI.confirm(message);
};

window.alert = function (message) {
  return window.electronAPI.alert(message);
};

function gotoGithubConfig() {
  const goto = new $tw.Story();
  goto.navigateTiddler('$:/core/ui/ControlPanel/Saving/GitHub');
}

// 暂不支持其他类型带有meta 的类型
// 同名文件_xxx 暂时不考虑
const extFile = {
  'text/vnd.tiddlywiki': '.tid',
  'text/markdown': '.md',
  'text/x-markdown': '.md',
  'application/pdf': '.pdf',
  'application/javascript': '.js',
  'text/css': '.css',
  'image/png': '.png',
};

function getTiddlerTitle(data) {
  const el = document.elementFromPoint(data.x, data.y);
  const attr = 'data-tiddler-title';
  const titleEl = el?.closest(`[${attr}]`);
  let title = titleEl?.getAttribute(attr) || null; // 获取属性值，若不存在则返回 null
  let newTitle = title;
  if ($tw.wiki.tiddlerExists(title)) {
    const { type } = $tw.wiki.getTiddler(title).fields;
    if (title.startsWith('$')) {
      console.log('replace $:? --> $__', title, type);
      newTitle = title.replace(/^\$:\//, '$__');
    }
    // if (!extFile[type]) return;

    const tiddlersPath = $tw.wiki.getTiddlerData(
      '$:/config/OriginalTiddlerPaths'
    );
    let lastTitle = `${newTitle}${extFile[type] || '.tid'}`;
    if (lastTitle.endsWith('.png.png')) {
      lastTitle = lastTitle.slice(0, -4);
    }
    return {
      title: lastTitle,
      maybeTitle: tiddlersPath[title],
    };
  }
}

if (window.$tw) {
  let getText = null; // 手动清空
  getText = (title) => {
    return $tw.wiki.getTiddlerText(title);
  };

  // 发送tiddler info
  window.electronAPI.onTidInfo((data) => {
    const res = getTiddlerTitle(data);
    if (res) {
      window.electronAPI.sendTidInfo(res);
    } else {
      window.electronAPI.sendTidInfo();
    }
  });

  const githubConfig = {
    repo: getText('$:/GitHub/Repo')?.split('/').pop(),
    owner: getText('$:/GitHub/Username'),
    token: localStorage.getItem('tw5-password-github'),
    branch: getText('$:/GitHub/Branch') || 'main',
  };

  // 如果有 token 再存储配置
  if (githubConfig.token) {
    window.electronAPI.sendGHConfig(githubConfig);
  }

  // 监听 github 配置跳转
  window.electronAPI.onConfigGithub(gotoGithubConfig);

  // enable official plugin library
  const pluginLibraryUrl = `https://tiddlywiki.com/library/v${$tw.version}/index.html`;
  const officialLibraryTiddler = '$:/config/OfficialPluginLibrary';
  if ($tw.wiki.getTiddler('url')?.fields?.enable === 'no') {
    $tw.wiki.setText(officialLibraryTiddler, 'url', null, pluginLibraryUrl, {
      suppressTimestamp: true,
    });
    $tw.wiki.setText(officialLibraryTiddler, 'enable', null, 'yes', {
      suppressTimestamp: true,
    });
  }

  // change tiddlywiki default sidebar layout
  const sidebarLayout = 'fluid-fixed';
  const sidebarLayoutTiddler =
    '$:/themes/tiddlywiki/vanilla/options/sidebarlayout';
  if (getText(sidebarLayoutTiddler) !== sidebarLayout) {
    $tw.wiki.setText(sidebarLayoutTiddler, 'text', null, sidebarLayout, {
      suppressTimestamp: true,
    });
  }
}
