import { type ITiddlyWiki } from 'tw5-typed';
import path from 'path';
import { app, } from 'electron';
import { log } from './logger';
import fs from 'fs'

// import { TiddlyWiki } from 'tiddlywiki';

let wiki;
export const tiddlywikiExtensionDir = path.join(app.getPath('userData'), 'extensions')
const wikiDir = path.join(tiddlywikiExtensionDir, 'tiddlywiki')
const pkgPath = path.join(wikiDir, 'package.json')

function isValidTiddlyWiki(dir: string) {
  if (!fs.existsSync(dir)) return false
  if (!fs.existsSync(pkgPath)) return false

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    return pkg.name && pkg.name.startsWith('tiddlywiki') && pkg.version
  } catch (err) {
    return false
  }
}

if (isValidTiddlyWiki(wikiDir)) {
  try {
    wiki = require(wikiDir)
    const pkg = require(pkgPath)
    log.info(`use user installed tiddlywiki ${pkg.version}, path is`, wikiDir)
  } catch (e) {
    log.warn("failed to load user tiddlywiki, fallback to system one", e)
    wiki = require('tiddlywiki')
  }
} else {
  log.info("use system tiddlywiki")
  wiki = require('tiddlywiki')
}

export const dynamicWiki = wiki;

export const tiddlywiki = (
  // dir = '.',
  args: string[] = [],
  preloadTiddlers: Record<string, unknown>[] = [],
  callback?: Function
): ITiddlyWiki => {
  const $tw = wiki.TiddlyWiki();
  $tw.boot.argv = [...args];
  if (preloadTiddlers.length > 0) {
    $tw.preloadTiddlerArray(preloadTiddlers);
  }
  if (typeof callback === 'function') {
    callback($tw);
  }
  $tw.boot.boot();
  return $tw;
};
