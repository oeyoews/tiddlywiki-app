const {
  ipcMain,
  shell,
  app,
  BrowserWindow,
  dialog,
  Menu,
} = require('electron');
const path = require('path');
const fs = require('fs');
const { TiddlyWiki } = require('tiddlywiki');
const { Conf: Config } = require('electron-conf');
const getPorts = require('get-port').default;
const preload = path.join(__dirname, "../preload/index.js");

let config;
let wikiPath;
let mainWindow;
let currentServer = null;
let currentPort = null;

const DEFAULT_PORT = 8080;

async function buildWiki() {
  try {
    const { boot } = TiddlyWiki();
    boot.argv = [wikiPath, '--build', 'index'];
    await boot.boot(() => {
      console.log('开始构建');
    });

    const outputPath = path.join(wikiPath, 'output', 'index.html');
    const result = await dialog.showMessageBox({
      type: 'info',
      title: '构建完成',
      message: `Wiki 已构建完成，是否在浏览器中预览？`,
      buttons: ['预览', '在文件夹中显示', '关闭'],
      defaultId: 0,
      cancelId: 2,
    });

    if (result.response === 0) {
      shell.openExternal(`file://${outputPath}`);
    } else if (result.response === 1) {
      shell.showItemInFolder(outputPath);
    }
  } catch (err) {
    dialog.showErrorBox('错误', `构建 Wiki 失败：${err.message}`);
  }
}

async function initWiki(wikiFolder, isFirstTime = false) {
  try {
    if (isFirstTime) {
      const result = await dialog.showOpenDialog({
        title: '选择 Wiki 文件夹位置',
        properties: ['openDirectory'],
        message: '请选择一个文件夹作为 Wiki 的存储位置',
      });

      if (!result.canceled && result.filePaths.length > 0) {
        wikiPath = result.filePaths[0];
        wikiFolder = wikiPath;
        config.set('wikiPath', wikiPath);
      }
    }

    const bootPath = path.join(wikiFolder, 'tiddlywiki.info');

    if (!fs.existsSync(bootPath)) {
      const { boot } = TiddlyWiki();
      boot.argv = [wikiFolder, '--init', 'server'];
      await boot.boot(() => {
        console.log('start init first');
      }); // 首次初始化必须要初始化启动下
      console.log('finished init');
    }

    if (currentServer) {
      currentServer = null;
    }

    // 获取可用端口
    currentPort = await getPorts({ port: DEFAULT_PORT });

    const { boot: twBoot } = TiddlyWiki();
    twBoot.argv = [wikiFolder, '--listen', `port=${currentPort}`];

    const startServer = () => {
      console.log(`start begin: http://localhost:${currentPort}`);
      mainWindow.loadURL(`http://localhost:${currentPort}`);
      mainWindow.webContents.once('did-finish-load', () => {
        // 获取页面标题并设置窗口标题
        const pageTitle = mainWindow.webContents.getTitle();
        mainWindow.setTitle(`${pageTitle} - ${wikiFolder}`);
      });
    };

    currentServer = twBoot;
    twBoot.boot(startServer);
  } catch (err) {
    dialog.showErrorBox('错误', `初始化 Wiki 失败：${err.message}`);
  }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });
  // 检查是否首次启动
  const isFirstTime = !config.get('wikiPath');

  // 初始化并加载 wiki
  initWiki(wikiPath, isFirstTime);
  // 注入渲染脚本
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      const script = document.createElement('script');
      script.src = 'file://${path.join(__dirname, '..', 'renderer', 'render.js').replace(/\\/g, '/')}';
      document.body.appendChild(script);
    `);
  });
  const menu = Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        {
          label: '打开 Wiki',
          click: openFolderDialog,
        },
        {
          label: '构建 Wiki',
          click: buildWiki,
        },
        {
          label: '在浏览器中打开',
          click: () => {
            if (currentServer && currentPort) {
              shell.openExternal(`http://localhost:${currentPort}`);
            }
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: '开发',
      submenu: [
        {
          label: '打开开发者工具',
          click: () => mainWindow.webContents.openDevTools({ mode: 'right' }),
        },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}
// 添加 openFolderDialog 函数定义
async function openFolderDialog() {
  const result = await dialog.showOpenDialog({
    title: '选择 Wiki 文件夹',
    properties: ['openDirectory'],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    if (wikiPath === result.filePaths[0]) {
      console.info('已经是当前打开的 Wiki 文件夹');
      return;
    }
    wikiPath = result.filePaths[0];
    config.set('wikiPath', wikiPath);
    await initWiki(wikiPath);
  }
}

// 添加 IPC 处理程序
ipcMain.handle('dialog:openWiki', openFolderDialog);
ipcMain.handle('wiki:build', buildWiki);
ipcMain.handle('wiki:openInBrowser', () => {
  if (currentServer && currentPort) {
    shell.openExternal(`http://localhost:${currentPort}`);
  }
});
ipcMain.handle('wiki:getInfo', () => {
  return {
    wikiPath,
    port: currentPort
  };
});

const initApp = async () => {
  config = new Config({
    defaults: {
      wikiPath: path.resolve('wiki'),
    },
  });

  // 初始化 wikiPath
  wikiPath = config.get('wikiPath');

  // 启动应用
  app.whenReady().then(createWindow);
};

// 将原来的立即执行函数替换为初始化调用
initApp();

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});