type DialogType = 'info' | 'confirm' | 'question';

interface ISaver {
  owner: string;
  repo: string;
  branch: string;
  wikiFolder: string;
  GITHUB_TOKEN: string;
  COMMIT_MESSAGE?: string;
}

interface CommitBody {
  message: string;
  content: string;
  branch: string;
  sha?: string; // 可选的 SHA 属性
}

type IMenuIconFile =
  | 'File'
  | 'warning'
  | 'tw-light'
  | 'tw-dark'
  | 'new-wiki'
  | 'folder'
  | 'folder-windows'
  | 'folder-linux'
  | 'folder-macOS'
  | 'import'
  | 'open-wiki'
  | 'exit'
  | 'restart'
  | 'build'
  | 'recent'
  | 'clear'
  | 'markdown'
  | 'format'
  | 'help'
  | 'search'
  | 'searchGoogle'
  | 'release';

type IContextIcon = 'copy' | 'save' | 'paste' | 'cut' | 'image' | 'menu';

type IMenuViewIcon =
  | 'web'
  | 'zoomIn'
  | 'zoomOut'
  | 'reset'
  | 'reload'
  | 'read'
  | 'screens';

type IMenuIconSetting = 'language' | 'autostart' | 'gitHub' | 'settings';

type IMenuHelpIcon =
  | 'about'
  | 'update'
  | 'log'
  | 'log2'
  | 'issue'
  | 'devtools'
  | 'console'
  | 'link'
  | 'link2'
  | 'i18n';

type IPlatform = 'macOS' | 'windows' | 'linux';

type IMenuIcon =
  | IMenuIconFile
  | IMenuIconSetting
  | IPlatform
  | IMenuHelpIcon
  | IContextIcon
  | IMenuViewIcon;

type IUpdateMenuType =
  | 'updateMenu'
  | 'updatingMenu'
  | 'downloadingApp'
  | 'restartMenu';
