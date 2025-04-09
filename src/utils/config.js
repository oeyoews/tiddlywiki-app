// 会导致打包出现两遍 node:xxx
// import { Conf, type ConfOptions } from 'electron-conf/main';
// const { Conf: Config } = require('electron-conf');
const { Conf } = require('electron-conf');

import { app } from 'electron';
import path from 'path';

// NOTE: C:/program files 需要提权
export const DEFAULT_WIKI_DIR = path.join(app.getPath('desktop'), 'wiki'); // use app.getPath('desktop')
// test
// const DEFAULT_WIKI_DIR = path.resolve('wiki'); // use app.getPath('desktop')
// C:\\Program Files

const options = {
  defaults: {
    winState: true, // 默认开启， 记录上次窗口位置
    // betaChannel: false,
    defaultPort: 9090,
    username: null,
    lan: false,
    icon: false,
    wikiPath: DEFAULT_WIKI_DIR,
    language: null,
    markdown: false,
    autocorrect: false,
    'lang-CN': false,
    recentWikis: [],
    github: {
      token: null,
    },
  },
};

export const config = new Conf(options);
