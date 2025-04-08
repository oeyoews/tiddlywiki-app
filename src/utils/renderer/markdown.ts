const goto = new $tw.Story();

export function importMarkdown(content: IMarkdownTiddler[]) {
  const importedTitle = '$:/markdownImported';
  let tiddlers = {
    tiddlers: {},
  };
  content.forEach((content) => {
    // let renameTitle = null;
    // if (
    //   // $tw.wiki.filterTiddlers(`[[${content.title}]!is[missing]]`).length > 0
    //   $tw.wiki.tiddlerExists(content.title)
    // ) {
    //   renameTitle = window.prompt(
    //     `${content.title} tiddler has exist, please rename this tiddler`,
    //     content.title + '-' + Date.now()
    //   );
    //   // 跳过此条目的导入
    //   if (!renameTitle) {
    //     return;
    //   }
    // }
    // if (renameTitle) {
    //   content.title = renameTitle;
    // }
    const tiddler = {
      tags: ['markdown'],
      // @ts-ignore
      title: content.title,
      ...content,
      type: 'text/markdown', // 放到最后面， 防止frontmatter 修改
    };
    // @ts-ignore
    tiddlers.tiddlers[content.title] = tiddler;
  });

  // $tw.wiki.deleteTiddler(importedTitle);
  $tw.wiki.addTiddler({
    title: importedTitle,
    'plugin-type': 'import',
    type: 'application/json',
    text: JSON.stringify(tiddlers),
    status: 'pending',
  });
  goto.navigateTiddler(importedTitle);
}
