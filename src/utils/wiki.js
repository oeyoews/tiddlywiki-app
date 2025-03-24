export const wikiInitArgs = (path) => [path, '--init', 'server'];
export const wikiStartupArgs = (path, port) => [
  path,
  '--listen',
  `port=${port}`,
  'root-tiddler=$:/core/save/all-external-js',
];

export const wikiBuildArgs = (path) => [path, '--build', 'index'];
export const buildIndexHTMLArgs = [
  '--render',
  '$:/plugins/tiddlywiki/tiddlyweb/save/offline',
  'index.html',
  'text/plain',
];
