// @ts-nocheck

const libtag = '$:/tags/PluginLibrary'
const options = {
  suppressTimestamp: true,
}

export function setOfficialLib() {
  // enable official plugin library
  // console.log($tw.version);
  const pluginLibraryUrl = `https://tiddlywiki.com/library/v${$tw.version}/index.html`;
  const officialLibraryTiddler = '$:/config/OfficialPluginLibrary';
  if ($tw.wiki.getTiddler(officialLibraryTiddler)?.fields?.enabled === 'no') {
    $tw.wiki.setText(officialLibraryTiddler, 'url', null, pluginLibraryUrl, options);
    $tw.wiki.setText(officialLibraryTiddler, 'enabled', null, 'yes', options);
  }
}

// @ts-nocheck
export function setCustomPluginLib() {
  const CM6LibraryTiddler = '$:/Library/Codemirror6';
  const fields = $tw.wiki.getTiddler(CM6LibraryTiddler)
  if (fields?.enabled !== 'yes' || fields.version !== '1.0.0') {
    const pluginLibraryUrl = `https://oeyoews.github.io/tiddlywiki-codemirror6/library/index.html`;
    $tw.wiki.addTiddler({
      title: CM6LibraryTiddler,
      tags: libtag,
      enabled: 'yes',
      caption: "CodeMirror6",
      url: pluginLibraryUrl,
      version: '1.0.0'
    })
  }
}

export function setNPL() {
  const NPLTiddler = '$:/Library/NPL';
  const fields = $tw.wiki.getTiddler(NPLTiddler)
  if (fields?.enabled !== 'yes' || fields.version !== '1.0.0') {
    const pluginLibraryUrl = `https://oeyoews.github.io/tiddlywiki-starter-kit/library/index.html`;
    $tw.wiki.addTiddler({
      title: NPLTiddler,
      tags: libtag,
      enabled: 'yes',
      caption: "NPL",
      url: pluginLibraryUrl,
      version: '1.0.0'
    })
  }
}
