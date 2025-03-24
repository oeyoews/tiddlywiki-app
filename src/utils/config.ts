const { Conf: Config } = require('electron-conf');
import path from 'path';

const DEFAULT_WIKI_DIR = path.resolve('wiki'); // use app.getPath('desktop')

export const config = new Config({
  defaults: {
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
});
