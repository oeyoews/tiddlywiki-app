// @ts-nocheck

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

if (window.$tw) {
  // console.log('renderer init');
  window.confirm = function (message) {
    return electronAPI.confirm(message);
  };

  window.alert = function (message) {
    return electronAPI.alert(message);
  };

  electronAPI.onImportMarkdown((event: Event, content: IMarkdownTiddler[]) => {
    importMarkdown(content);
  });

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

  // support subwiki
  const twFilePathConfigTiddler = '$:/config/FileSystemPaths';
  const subwikiText = '[tag[private]addprefix[subwiki/]]';
  if (
    !$tw.wiki.tiddlerExists(twFilePathConfigTiddler) ||
    !$tw.wiki.getTiddlerText(twFilePathConfigTiddler)
  ) {
    // 直接写入
    $tw.wiki.setText(twFilePathConfigTiddler, 'text', null, subwikiText);
    console.log(twFilePathConfigTiddler, 'not exist');
  } else {
    let oldText = $tw.wiki.getTiddlerText(twFilePathConfigTiddler);
    if (!oldText.includes(subwikiText)) {
      oldText = `${oldText}\n${subwikiText}`;
      console.log(twFilePathConfigTiddler, 'updated');
      // 更新tiddler
      $tw.wiki.setText(twFilePathConfigTiddler, 'text', null, oldText);
    }
  }
}

function importMarkdown(content: IMarkdownTiddler[]) {
  const importedTitle = '$:/markdownImported';
  let tiddlers = {
    tiddlers: {},
  };
  content.forEach((content) => {
    // let renameTitle = null;
    // if (
    //   // $tw.wiki.filterTiddlers(`[[${content.title}]!is[missing]]`).length > 0
    //   $tw.wiki.tiddlerExists(content.title)
    // ) {
    //   renameTitle = window.prompt(
    //     `${content.title} tiddler has exist, please rename this tiddler`,
    //     content.title + '-' + Date.now()
    //   );
    //   // 跳过此条目的导入
    //   if (!renameTitle) {
    //     return;
    //   }
    // }
    // if (renameTitle) {
    //   content.title = renameTitle;
    // }
    const tiddler = {
      tags: ['markdown'],
      // @ts-ignore
      title: content.title,
      ...content,
      type: 'text/markdown', // 放到最后面， 防止frontmatter 修改
    };
    // @ts-ignore
    tiddlers.tiddlers[content.title] = tiddler;
  });

  // $tw.wiki.deleteTiddler(importedTitle);
  $tw.wiki.addTiddler({
    title: importedTitle,
    'plugin-type': 'import',
    type: 'application/json',
    text: JSON.stringify(tiddlers),
    status: 'pending',
  });
  const goto = new $tw.Story();
  goto.navigateTiddler(importedTitle);
}
