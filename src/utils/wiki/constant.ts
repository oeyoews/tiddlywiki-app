export const wikiInitArgs = (path: string) => [path, '--init', 'server'];
export const wikiStartupArgs = (path: string, port: number) => [
  path,
  '--listen',
  `port=${port}`,
  // 'root-tiddler=$:/core/save/all-external-js',
];

export const wikiBuildArgs = (path: string, password?: string) => {
  let args = [path, '--build', 'index'];
  if (password) {
    args = [path, '--password', password, ...buildIndexHTMLArgs];
  }
  return args;
};

export const buildIndexHTMLArgs = [
  '--render',
  '$:/plugins/tiddlywiki/tiddlyweb/save/offline',
  'index.html',
  'text/plain',
  '',
  'publishFilter',
  '-[tag[private]] -[is[draft]]',
];

export const defaultPlugins = [
  'tiddlywiki/tiddlyweb',
  'tiddlywiki/filesystem',
  'tiddlywiki/highlight',
];
