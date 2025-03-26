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
  | 'new-wiki'
  | 'folder'
  | 'import'
  | 'open-wiki'
  | 'exit'
  | 'restart'
  | 'build'
  | 'recent'
  | 'clear'
  | 'release';

type IContextIcon = 'copy' | 'save' | 'paste' | 'cut' | 'image';

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
  | 'issue'
  | 'devtools'
  | 'link'
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
