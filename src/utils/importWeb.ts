import { TWProtocol } from '@/main';
import { BrowserWindow, dialog } from 'electron';
import { log } from './logger';

// start or second-instance or ready
// tiddlywiki://?_source=web&title=999
export function importWeb(win: BrowserWindow, argv: string[], _url?: string) {
  if (!win) {
    dialog.showErrorBox('no win', 'no win');
    return;
  }
  let url;
  // if (process.platform != 'darwin') {
  // Windows 下从 argv 中解析协议 URL
  if (argv) {
    url = argv.find((arg: string) => arg.startsWith(TWProtocol + '://'));
  } else if (_url) {
    url = _url;
  }
  if (url) {
    const info = new URL(url);
    const source = info.searchParams.get('_source');
    const { _source, ...tiddler } = Object.fromEntries(
      info.searchParams.entries()
    );
    // 校验来源
    if (source === 'web') {
      log.info('Begin import tiddler from', source);
      // 注意， 这里需要等待render.js 执行完毕
      setTimeout(() => {
        win.webContents.send('open-url', tiddler);
      }, 100);
    }
  } else {
    log.info('no get valid url', url, _url);
  }
  // }
}
