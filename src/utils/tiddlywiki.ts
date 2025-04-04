import { ITiddlyWiki, TiddlyWiki } from 'tw5-typed';

export const tiddlywiki = (
  // dir = '.',
  args: string[] = [],
  preloadTiddlers: Record<string, unknown>[] = [],
  callback?: Function
): ITiddlyWiki => {
  const $tw = TiddlyWiki();
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
