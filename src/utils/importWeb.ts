import { TWProtocol } from '@/main';
import { BrowserWindow } from 'electron';

// start or second-instance
// tiddlywiki://?_source=web&title=999
export function importWeb(argv: [], win: BrowserWindow, _url?: string) {
  console.log(argv, _url);
  let url;
  if (process.platform != 'darwin') {
    // Windows 下从 argv 中解析协议 URL
    if (argv) {
      url = argv.find((arg: string) => arg.startsWith(TWProtocol + '://'));
    } else if (_url) {
      url = _url;
    }
    if (url) {
      const info = new URL(url);
      const { _source, ...tiddler } = Object.fromEntries(
        info.searchParams.entries()
      );
      // 校验来源
      if (_source != 'web') return;
      win.webContents.send('open-url', tiddler);
    }
  }
}
