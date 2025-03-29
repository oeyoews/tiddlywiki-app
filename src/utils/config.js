// 会导致打包出现两遍 node:xxx
// import { Conf, type ConfOptions } from 'electron-conf/main';
// const { Conf: Config } = require('electron-conf');
const { Conf } = require('electron-conf');

import { app } from 'electron';
import path from 'path';

// NOTE: C:/program files 需要提权
const DEFAULT_WIKI_DIR = path.join(app.getPath('desktop'), 'wiki'); // use app.getPath('desktop')

const options = {
  defaults: {
    // betaChannel: false,
    icon: true,
    wikiPath: DEFAULT_WIKI_DIR,
    language: null,
    markdown: false,
    autocorrect: false,
    'lang-CN': false,
    recentWikis: [],
    github: {
      token: '',
      owner: '',
      repo: '',
      branch: 'main',
    },
  },
};

export const config = new Conf(options);
