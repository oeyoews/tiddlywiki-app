// @ts-nocheck
export function setSubwiki() {
  // support subwiki
  const twFilePathConfigTiddler = '$:/config/FileSystemPaths';
  const subwikiText = '[tag[private]addprefix[subwiki/]]';
  if (
    !$tw.wiki.tiddlerExists(twFilePathConfigTiddler) ||
    !$tw.wiki.getTiddlerText(twFilePathConfigTiddler)
  ) {
    // 直接写入
    $tw.wiki.setText(twFilePathConfigTiddler, 'text', null, subwikiText);
    console.log(twFilePathConfigTiddler, 'not exist');
  } else {
    let oldText = $tw.wiki.getTiddlerText(twFilePathConfigTiddler);
    if (!oldText.includes(subwikiText)) {
      oldText = `${oldText}\n${subwikiText}`;
      console.log(twFilePathConfigTiddler, 'updated');
      // 更新tiddler
      $tw.wiki.setText(twFilePathConfigTiddler, 'text', null, oldText);
    }
  }
}
