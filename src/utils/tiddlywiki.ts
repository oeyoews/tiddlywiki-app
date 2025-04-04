import { ITiddlyWiki, TiddlyWiki } from 'tw5-typed';

export const tiddlywiki = (
  // dir = '.',
  args: string[] = [],
  preloadTiddlers: Record<string, unknown>[] = []
): ITiddlyWiki => {
  const $tw = TiddlyWiki();
  $tw.boot.argv = [...args];
  if (preloadTiddlers.length > 0) {
    $tw.preloadTiddlerArray(preloadTiddlers);
  }
  $tw.boot.boot();
  return $tw;
};
