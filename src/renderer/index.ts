// @ts-nocheck

function gotoGithubConfig() {
  const goto = new $tw.Story();
  goto.navigateTiddler('$:/core/ui/ControlPanel/Saving/GitHub');
}

if (window.$tw) {
  const pride = () => {
    var duration = 0.5 * 1000;
    var end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };
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

  async function generateQrCode(text, options) {
    return (
      'data:image/svg+xml,' +
      encodeURIComponent(
        await QRCode.toString(text, {
          type: 'svg',
          ...options,
        })
      )
    );
  }
  electronAPI.onShowQRCode(async (event: Event, { host, port, message }) => {
    const url = `http://${host}:${port}`;
    const res = await generateQrCode(url);
    const qrcodeTiddler = '$:/temp/host/qrcode';
    const qrImg = `<center>${message}: <br/> <img src="${res}" width=256/> <br /> ${url} </center>`;
    $tw.wiki.setText(qrcodeTiddler, 'text', null, qrImg);
    $tw.wiki.setText(qrcodeTiddler, 'subtitle', null, 'Wiki QRCode');
    $tw.wiki.setText(qrcodeTiddler, 'mask-closable', null, 'yes');
    $tw.modal.display(qrcodeTiddler);
  });

  // imported successfully
  electronAPI.onConfetti(() => {
    pride();
  });

  // 尺寸变化写入 description
  electronAPI.onTitleFetched(async (data: any) => {
    const { text, title } = getImage(data);
    if (!title) {
      console.log('no imagedata');
      return;
    }
    const newImage = await electronAPI.startFetchData(text);
    if (!newImage) {
      console.log('newimage not exist');
      return;
    }
    $tw.wiki.setText(title, 'text', null, newImage);
    // TODO: 提示压缩成功
  });

  function getImage(data) {
    const el = document.elementFromPoint(data.x, data.y);
    const attr = 'data-tiddler-title';
    const titleEl = el?.closest(`[${attr}]`);
    const title = titleEl?.getAttribute(attr) || null; // 获取属性值，若不存在则返回 null

    if ($tw.wiki.tiddlerExists(title)) {
      const { type, text } = $tw.wiki.getTiddler(title).fields;
      if (type === 'image/png') {
        return { text, title };
      }
    }
  }

  function getTiddlerTitle(data) {
    const el = document.elementFromPoint(data.x, data.y);
    const attr = 'data-tiddler-title';
    const titleEl = el?.closest(`[${attr}]`);
    let title = titleEl?.getAttribute(attr) || null; // 获取属性值，若不存在则返回 null
    let newTitle = title.replace(/[/\\]/g, '_'); // 正反斜杠转换成_
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

  window.electronAPI.onTidInfoVscode((data) => {
    const res = getTiddlerTitle(data);
    if (res) {
      window.electronAPI.sendTidInfoVscode(res);
    }
  });
  const githubPasswordKey = 'tw5-password-github';

  // 主进程通知渲染进程， 渲染进程将当前wiki的gh config 发送给主进程
  electronAPI.onGetGHConfig(() => {
    const githubConfig = {
      repo: getText('$:/GitHub/Repo')?.split('/').pop(),
      owner: getText('$:/GitHub/Username'),
      token: localStorage.getItem(githubPasswordKey),
      branch: getText('$:/GitHub/Branch') || 'main',
    };
    electronAPI.sendGHConfig(githubConfig);
  });

  // 监听 github 配置跳转
  window.electronAPI.onConfigGithub((data) => {
    if (data) {
      localStorage.setItem(githubPasswordKey, data);
    }
    gotoGithubConfig();
  });

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
