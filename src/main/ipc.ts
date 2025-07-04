import { config } from '@/utils/config';
import { convertPathToVSCodeUri } from '@/utils/convertPathToVSCodeUri';
import saveToGitHub from '@/utils/github-saver';
import { log } from '@/utils/logger';
import { app, BrowserWindow, ipcMain, net, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { TPlatform } from '.';

const tempDir = app.getPath('temp');
let spawn: null;
let pngquantDir = path.join(
  app.isPackaged
    ? process.resourcesPath
    : path.join(__dirname, '..', 'resources'),
  'pngquant'
);
// let pngquant: any;
let pngquantWindows = path.join(
  pngquantDir,
  // processEnv.VITE_PUBLIC,
  'pngquant-windows.exe'
);
let pngquantMacos = path.join(pngquantDir, 'pngquant', 'pngquant-macOs');
let pngquant: any;

export function registerIpcEvent(win: BrowserWindow) {
  // ghconfig
  ipcMain.on(
    'update-gh-config',
    async (_event, { owner, repo, branch, token }: any) => {
      const wikiFolder = config.get('wikiPath');
      let _token = config.get('github').token;
      if (token) {
        config.set('github', { token }); // 更新配置文件的 github token
      }

      if (!owner || !repo || !branch) {
        log.info('GitHub config is not correct');
        win.webContents.send('config-github');
        return;
      }

      await saveToGitHub({
        wikiFolder,
        owner,
        repo,
        GITHUB_TOKEN: token || _token,
        branch,
        win,
      });
    }
  );

  ipcMain.on('tid-info-vscode', (_event, data) => {
    const tiddlerFolder = path.join(config.get('wikiPath'), 'tiddlers');
    log.info(data, 'received tid-info(vscode)');
    if (!data?.title) {
      return;
    }
    const tidPath = path.join(tiddlerFolder, data.title);
    let maybeTidPath = null;
    if (data?.maybeTitle) {
      maybeTidPath = path.join(
        config.get('wikiPath'),
        'tiddlers',
        data?.maybeTitle
      );
    }
    if (fs.existsSync(tidPath)) {
      shell.openExternal(convertPathToVSCodeUri(tidPath));
    } else if (maybeTidPath && fs.existsSync(maybeTidPath)) {
      shell.openExternal(convertPathToVSCodeUri(maybeTidPath));
    } else {
      const subwikiTid = path.join(tiddlerFolder, 'subwiki', data.title);
      // 尝试读取 subwiki
      if (fs.existsSync(subwikiTid)) {
        shell.openExternal(convertPathToVSCodeUri(subwikiTid));
      }
    }
  });

  ipcMain.on('tid-info', (_event, data) => {
    const tiddlerFolder = path.join(config.get('wikiPath'), 'tiddlers');
    log.info(data, 'received tid-info');
    if (!data?.title) {
      // dialog.showErrorBox(t('dialog.openfileNotSupported'), '');
      log.info('open  default fodler');
      shell.openPath(tiddlerFolder);
      return;
    }
    const tidPath = path.join(tiddlerFolder, data.title);
    let maybeTidPath = null;
    if (data?.maybeTitle) {
      maybeTidPath = path.join(
        config.get('wikiPath'),
        'tiddlers',
        data?.maybeTitle
      );
    }
    if (fs.existsSync(tidPath)) {
      log.info('open file', tidPath);
      shell.showItemInFolder(tidPath);
    } else if (maybeTidPath && fs.existsSync(maybeTidPath)) {
      shell.showItemInFolder(maybeTidPath);
      log.info('open file form maybeTitle');
    } else {
      const subwikiTid = path.join(tiddlerFolder, 'subwiki', data.title);
      // 尝试读取 subwiki
      if (fs.existsSync(subwikiTid)) {
        shell.showItemInFolder(subwikiTid);
      } else {
        // 默认打开 文件夹
        shell.openPath(tiddlerFolder);
      }
      // TODO: 递归查询相应后缀的文件是否存在
      log.error(tidPath, 'not exit');
    }
  });

  ipcMain.handle('fetchRss', async (_event, data) => {
    const { url } = data;
    const res = await net.fetch(url, {
      method: 'GET',
    });
    const rssData = await res.text();
    return rssData;
  });

  // 目前仅开始针对windows 进行支持
  if (TPlatform === 'windows' || TPlatform === 'macOs') {
    // 主进程
    ipcMain.handle('get-data', async (_event, data) => {
      const imagePath = path.join(tempDir, 'pngquant.png');
      const minifiedImagePath = path.join(tempDir, 'pngquant-minified.png');
      const buffer = Buffer.from(data, 'base64');
      fs.writeFileSync(imagePath, buffer); // 图片写入
      if (fs.existsSync(minifiedImagePath)) {
        fs.rmSync(minifiedImagePath); // 清空就图片
      }

      // TODO: 兼容性待测试, postinstall 下载exe 会失败了??
      // if (!pngquant) {
      //   // @ts-ignore
      //   pngquant = (await import('pngquant-bin')).default;
      // }

      if (!spawn) {
        // @ts-ignore
        const crossSpawn = await import('cross-spawn');
        spawn = crossSpawn.default;
      }
      if (!pngquant) {
        if (TPlatform === 'windows') {
          pngquant = `"${pngquantWindows}"`;
        } else if (TPlatform === 'macOs') {
          pngquant = `"${pngquantMacos}"`;
        }
      }
      // @ts-ignore
      const child = spawn(
        pngquant,
        ['--quality=65-80', '--output', minifiedImagePath, imagePath],
        { stdio: 'inherit', shell: true } // shell muse be true
      );
      return new Promise((resolve, reject) => {
        child.on('error', (error: any) => {
          log.error('Error(pngquant):', error);
        });
        // fs.writeFileSync(minifiedImagePath, buffer); // 图片写入
        child.on('close', () => {
          if (!fs.existsSync(minifiedImagePath)) {
            return reject(
              new Error(
                'Minified image not found, maybe this image has minified'
              )
            );
          }
          const buffer = fs.readFileSync(minifiedImagePath);
          const newData = buffer.toString('base64');
          resolve(newData);
        });
      });
    });
  }
}
