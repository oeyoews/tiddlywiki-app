const { Conf: Config } = require('electron-conf');
const DEFAULT_WIKI_DIR = path.resolve('wiki'); // use app.getPath('desktop')
import path from 'path';

export const config = new Config({
  defaults: {
    wikiPath: DEFAULT_WIKI_DIR,
    language: 'en-US',
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
