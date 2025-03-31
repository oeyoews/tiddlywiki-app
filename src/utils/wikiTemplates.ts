// @version: 5.3.6

// @version: 5.3.6
export const wikiTemplates = {
  default: 'server',
  '-': '',
  'tiddlywiki starter kit': 'https://neotw.vercel.app/offline.html',
  notebook: 'https://oeyoews.github.io/tiddlywiki-templates/notebook.html',
  xp: 'https://keatonlao.github.io/tiddlywiki-xp/index.html',
  mptw5: 'https://mptw5.tiddlyhost.com',
  'delphes-notes': 'https://delphes-notes-light-edition.tiddlyhost.com',
  grok: 'https://grok-tiddlywiki-official.tiddlyhost.com/',
  'tiddly-template':
    'https://oeyoews.github.io/tiddlywiki-templates/tiddly-template.html',
};

export type IWikiTemplate = Omit<typeof wikiTemplates, 'default' | '-'>;
