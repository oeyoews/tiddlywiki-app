// 监听 DOM 加载完成
// document.addEventListener('DOMContentLoaded', () => {
// 	console.log('loaded')
// });

const getText = (title) => {
  return $tw.wiki.getTiddlerText(title);
};

function gotoGithubConfig() {
  const goto = new $tw.Story();
  goto.navigateTiddler('$:/core/ui/ControlPanel/Saving/GitHub');
}

if (window.$tw) {
  const githubConfig = {
    repo: getText('$:/GitHub/Repo')?.split('/').pop(),
    owner: getText('$:/GitHub/Username'),
    token: localStorage.getItem('tw5-password-github'),
    branch: getText('$:/GitHub/Branch') || 'main',
  };

  // 如果有 token 再存储配置
  if (githubConfig.token) {
    window.electronAPI.sendTiddlyWikiInstance(githubConfig);
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

// const renderDom = async () => {
//   // 获取 Wiki 信息
//   const wikiInfo = await window.electronAPI.getWikiInfo();
//   console.log(wikiInfo, 'wikiinfo');

//   // 添加自定义菜单按钮到 TiddlyWiki 界面
//   const menuBar = document.querySelector('.tc-page-controls');
//   if (menuBar) {
//     // 添加构建按钮
//     const buildButton = document.createElement('button');
//     buildButton.className =
//       'tc-btn-invisible tc-btn-%24%3A%2Fcore%2Fui%2FButtons%2Fexport';
//     buildButton.innerHTML = 'build';
//     buildButton.onclick = async () => {
//       await window.electronAPI.buildWiki();
//     };
//     menuBar.appendChild(buildButton);

//     // 添加在浏览器中打开按钮
//     const openInBrowserButton = document.createElement('button');
//     openInBrowserButton.className =
//       'tc-btn-invisible tc-btn-%24%3A%2Fcore%2Fui%2FButtons%2Fexport';
//     openInBrowserButton.innerHTML = 'open';
//     openInBrowserButton.onclick = async () => {
//       await window.electronAPI.openInBrowser();
//     };
//     menuBar.appendChild(openInBrowserButton);
//   }

//   // 更新文档标题
//   const updateTitle = () => {
//     const title = document.title;
//     if (title && wikiInfo.wikiPath) {
//       document.title = `${title} - ${wikiInfo.wikiPath}`;
//     }
//   };

//   // 监听标题变化
//   //   const observer = new MutationObserver(updateTitle);
//   //   observer.observe(document.querySelector('title'), { childList: true });
// };

// 添加自定义样式
// const style = document.createElement('style');
// style.textContent = `
//   .tc-btn-invisible {
//     padding: 3px 8px;
//     margin: 0 4px;
//     border: none;
//     background: transparent;
//     cursor: pointer;
//   }

//   .tc-btn-invisible:hover {
//     background-color: rgba(0,0,0,0.1);
//     border-radius: 3px;
//   }
// `;
// document.body.appendChild(style);
// TODO: 添加配置，可以自定义开启
// renderDom()
