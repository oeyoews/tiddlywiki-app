// @ts-nocheck
export function setOfficialLib() {
  // enable official plugin library
  console.log($tw.version);
  const pluginLibraryUrl = `https://tiddlywiki.com/library/v${$tw.version}/index.html`;
  const officialLibraryTiddler = '$:/config/OfficialPluginLibrary';
  if ($tw.wiki.getTiddler(officialLibraryTiddler)?.fields?.enabled === 'no') {
    $tw.wiki.setText(officialLibraryTiddler, 'url', null, pluginLibraryUrl, {
      suppressTimestamp: true,
    });
    $tw.wiki.setText(officialLibraryTiddler, 'enabled', null, 'yes', {
      suppressTimestamp: true,
    });
  }
}
