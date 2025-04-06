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
    'image/x-icon': '.ico',
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

  // set favicon
  if (
    !$tw.wiki.getTiddlerText('$:/favicon.ico') ||
    !$tw.wiki.tiddlerExists('$:/favicon.ico')
  ) {
    console.log('set default $:/favicon.ico');
    $tw.wiki.addTiddler({
      title: '$:/favicon.ico',
      type: 'image/svg+xml',
      text: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m12 0l10.23 6v12L12 24L1.77 18V6zm3.961 17.889l.154-.02c.113-.043.22-.081.288-.19c.227-.329-.357-.462-.566-.827s-1.071-2.364-.418-2.924s1.359-.79 1.629-1.315c.117-.236.238-.475.269-.742c.159.132.283.255.497.262c.567.036 1.054-.658 1.307-1.315c.135-.404.244-.832.218-1.226c-.069-.76.013-1.582.62-2.087c-.599.302-1.167.69-1.845.789c-.374-.114-.75-.216-1.147-.2c-.194-.253-.456-.727-.797-.782c-.58.208-.597 1.105-.842 2.321a5.4 5.4 0 0 0-1.154-.193c-.54-.035-1.42.134-2.038.116c-.619-.018-1.836-.562-2.849-.445c-.407.05-.817.12-1.195.291c-.231.105-.565.421-.733.468c-1.69.473-4.442.453-3.879-2.102c.044-.196.056-.373-.03-.417c-.11-.055-.17.06-.234.187c-.985 2.138.764 3.514 2.752 3.52c.625-.048.324-.007.904-.118l-.015.082a1.87 1.87 0 0 0 .865 1.718c-.27.771-.805 1.389-1.173 2.097c.138.881 1.031 2.057 1.4 2.225c.326.147 1.036.149 1.2-.089c.059-.111.02-.351-.044-.474c.277.308.651.736 1.013.942c.217.104.434.17.677.18l.31-.016c.154-.033.336-.058.44-.195c.116-.2.007-.756-.476-.796s-.795-.222-1.24-.882c-.365-.638.077-1.517.226-2.145c.765.123 1.535.22 2.31.222c.336-.017.67-.03 1.001-.093c.106.27.402 1.025.404 1.239c.007.601-.219 1.205-.121 1.807c.06.177.005.512.35.526l.388.018l.267-.008c.341.573.637.572 1.307.591m-7.518-1.66l-.063-.056c-.184-.198-.66-.544-.572-.865c.075-.238.213-.457.323-.683l-.004.023c-.02.282-.059.56.032.837c.278.228.663.59.918.837c-.138-.038-.4-.117-.53-.066l-.104-.026z"/></svg>',
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
