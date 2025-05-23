const config = {
  // $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  protocols: [
    {
      name: 'TiddlyWiki Protocol',
      schemes: ['tiddlywiki'],
    },
  ],
  // appId: 'tiddlywiki.app',
  asar: true,
  directories: {
    output: 'release/${version}',
  },
  generateUpdatesFilesForAllChannels: true,
  extraFiles: [
    {
      from: 'LICENSE',
      to: 'LICENSE',
    },
    {
      from: 'resources/',
      to: 'resources/',
      // filter: ['**/*.exe'],
    },
  ],
  files: ['dist', 'LICENSE'],
  mac: {
    artifactName: '${productName}-${version}-${arch}.${ext}',
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64'],
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64'],
      },
    ],
  },
  linux: {
    artifactName: '${productName}-${version}-${arch}.${ext}',
    target: [
      {
        target: 'deb',
        arch: ['arm64', 'x64'],
      },
      {
        target: 'AppImage',
        arch: ['arm64', 'x64'],
      },
      {
        target: 'pacman',
        arch: ['arm64', 'x64'],
      },
      // {
      //   target: 'rpm',
      //   arch: ['arm64', 'x64'],
      // },
    ],
    maintainer: 'oeyoews',
    category: 'Utility',
  },
  win: {
    artifactName: '${productName}-${version}.${ext}',
    target: ['nsis'],
  },
  nsis: {
    oneClick: false,
    allowElevation: true,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    displayLanguageSelector: false,
    shortcutName: 'TiddlyWiki5 App',
  },
  publish: {
    provider: 'github',
    owner: 'oeyoews',
    repo: 'tiddlywiki-app',
  },
};

export default config;
