import { config } from '../config';

export const wikiInitArgs = (path: string) => [path, '--init', 'server'];
const host = 'host=0.0.0.0';

export const wikiStartupArgs = (
  path: string,
  port: number
  // lan: boolean = true
) => [
  path,
  '--listen',
  `port=${port}`,
  `anon-username=${config.get('username') || ''}`,
  ...(!!config.get('lan') ? [host] : []),
  // 'root-tiddler=$:/core/save/all-external-js',
  // 'use-browser-cache=yes',
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
