import { type ITiddlerFields } from 'tiddlywiki';

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
    const goto = new $tw.Story();
    goto.navigateTiddler(importedTitle);
  } else {
    console.warn('no title');
  }
}
