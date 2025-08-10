import { type ITiddlerFields } from 'tw5-typed';

export function importTiddlerFromBrowser(tiddler: ITiddlerFields) {
  const { title, ...fields } = tiddler;
  if (title) {
    let tiddlers = {
      tiddlers: {} as any,
    };
    tiddlers.tiddlers[title] = tiddler;
    const importedTitle = '$:/webImported';
    $tw.wiki.addTiddler({
      title: importedTitle,
      ['popup-' + title]: 'yes', // 默认展开
      'plugin-type': 'import',
      type: 'application/json',
      text: JSON.stringify(tiddlers),
      status: 'pending',
    });
    new $tw.Story().navigateTiddler(importedTitle);
  } else {
    console.warn('no title');
  }
}
