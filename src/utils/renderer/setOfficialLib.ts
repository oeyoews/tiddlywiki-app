// @ts-nocheck
export function setOfficialLib() {
  // enable official plugin library
  const pluginLibraryUrl = `https://tiddlywiki.com/library/v${$tw.version}/index.html`;
  const officialLibraryTiddler = '$:/config/OfficialPluginLibrary';
  if ($tw.wiki.getTiddler('url')?.fields?.enable === 'no') {
    $tw.wiki.setText(officialLibraryTiddler, 'url', null, pluginLibraryUrl, {
      suppressTimestamp: true,
    });
    $tw.wiki.setText(officialLibraryTiddler, 'enable', null, 'yes', {
      suppressTimestamp: true,
    });
  }
}
