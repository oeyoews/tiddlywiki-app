export const wikiInitArgs = (path: string) => [path, '--init', 'server'];
export const wikiStartupArgs = (path: string, port: number) => [
  path,
  '--listen',
  `port=${port}`,
  'root-tiddler=$:/core/save/all-external-js',
];

export const wikiBuildArgs = (path: string) => [path, '--build', 'index'];
export const buildIndexHTMLArgs = [
  '--render',
  '$:/plugins/tiddlywiki/tiddlyweb/save/offline',
  'index.html',
  'text/plain',
];

export const defaultPlugins = [
  'tiddlywiki/tiddlyweb',
  'tiddlywiki/filesystem',
  'tiddlywiki/highlight',
];
