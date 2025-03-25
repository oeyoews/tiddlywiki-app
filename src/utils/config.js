// 会导致打包出现两遍 node:xxx
// import { Conf, type ConfOptions } from 'electron-conf/main';
// const { Conf: Config } = require('electron-conf');
const { Conf } = require('electron-conf');

import path from 'path';

const DEFAULT_WIKI_DIR = path.resolve('wiki'); // use app.getPath('desktop')

const options = {
  defaults: {
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
