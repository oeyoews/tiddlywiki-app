// @ts-nocheck
import { importTiddlerFromBrowser } from '@/utils/renderer/clipper';
import { importMarkdown } from '@/utils/renderer/markdown';
import { setFavicon } from '@/utils/renderer/setFavicon';
import { setOfficialLib } from '@/utils/renderer/setOfficialLib';
import { setSubwiki } from '@/utils/renderer/setSubwiki';

if (window.$tw) {
  function gotoGithubConfig() {
    new $tw.Story().navigateTiddler('$:/core/ui/ControlPanel/Saving/GitHub');
  }

  electronAPI.onImportMDFromWeb(async (data) => {
    // console.log('data', 'import tiddler from web', data);
    const text = await navigator.clipboard.readText();
    importTiddlerFromBrowser({ ...data, text });
  });

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

  setOfficialLib();

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
  setFavicon();
  setSubwiki();
}
