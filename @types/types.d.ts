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
  | 'config'
  | 'export'
  | 'username'
  | 'winState'
  | 'open'
  | 'gear'
  | 'plus'
  | 'plus2'
  | 'web_app'
  | 'folder-wiki'
  | 'folder-opened'
  | 'panda'
  | 'folder-wiki1-dark'
  | 'folder-wiki1-light'
  | 'trash'
  | 'error'
  | 'lock'
  | 'import'
  | 'minimize'
  | 'tw-light'
  | 'tw-dark'
  | 'new-wiki'
  | 'html'
  | 'new-folder-template'
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
  | 'downloading'
  | 'release';

type IContextIcon = 'copy' | 'save' | 'paste' | 'cut' | 'image' | 'menu';

type IMenuViewIcon =
  | 'web'
  | 'subwiki'
  | 'zoomIn'
  | 'zoomOut'
  | 'reset'
  | 'reload'
  | 'read'
  | 'screens';

type IMenuIconSetting =
  | 'language'
  | 'autostart'
  | 'gitHub'
  | 'settings'
  | 'power';

type IMenuHelpIcon =
  | 'about'
  | 'info'
  | 'bug'
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

type IMarkdownTiddler = {
  title: string;
  text: string;
  modified: string;
};

interface IBuildOptions {
  password?: string;
  // outputPath?: string
}

type IRecentWikisWithTag = {
  path: string;
  running: boolean;
};

type IWinState = {
  width: number;
  height: number;
  x: number;
  y: number;
  isMaximized: boolean;
  isFullScreen: boolean;
};
