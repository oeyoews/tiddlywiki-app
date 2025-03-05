const {shell, app, BrowserWindow,BrowserView, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { TiddlyWiki } = require("tiddlywiki");

let mainWindow;
let wikiPath = path.join(__dirname, "wiki"); // 默认 wiki 文件夹路径
let currentServer = null;

const DEFAULT_PORT = 8080;

async function buildWiki() {
  try {
    const { boot } = TiddlyWiki()
    boot.argv = [wikiPath, '--build', 'index']
    await boot.boot(() => {
      console.log('开始构建')
    })

    const outputPath = path.join(wikiPath, 'output', 'index.html')
    const result = await dialog.showMessageBox({
      type: 'info',
      title: '构建完成',
      message: `Wiki 已构建完成，是否在浏览器中预览？`,
      buttons: ['预览', '在文件夹中显示', '关闭'],
      defaultId: 0,
      cancelId: 2
    })

    if (result.response === 0) {
      shell.openExternal(`file://${outputPath}`)
    } else if (result.response === 1) {
      shell.showItemInFolder(outputPath)
    }
  } catch (err) {
    dialog.showErrorBox("错误", `构建 Wiki 失败：${err.message}`)
  }
}

async function initWiki(wikiFolder) {
  try {
	// TODO: 端口检测，随机端口
    const bootPath = path.join(wikiFolder, "tiddlywiki.info");

    if (!fs.existsSync(bootPath)) {
      const { boot } = TiddlyWiki();
      boot.argv = [wikiFolder, "--init", 'server'];
		await boot.boot(() => {
		  console.log('start init first')
	  }); // 首次初始化必须要初始化启动下
	  console.log('finished init')
    }

    if (currentServer) {
      currentServer = null;
    }

    const { boot: twBoot } = TiddlyWiki();
    twBoot.argv = [
    	wikiFolder,
      "--listen",
      `port=${DEFAULT_PORT}`,
    ];

    const startServer = () => {
      console.log(`start begin: http://localhost:${DEFAULT_PORT}`); mainWindow.loadURL(`http://localhost:${DEFAULT_PORT}`);
    };

    currentServer = twBoot;
    twBoot.boot(startServer);
  } catch (err) {
    dialog.showErrorBox("错误", `初始化 Wiki 失败：${err.message}`);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // // 创建侧边栏视图
  // const sidebarView = new BrowserView({
  //   webPreferences: {
  //     nodeIntegration: false,
  //     contextIsolation: true,
  //   },
  // });

  // 创建主内容视图
  const mainView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  // mainWindow.addBrowserView(sidebarView);
  mainWindow.addBrowserView(mainView);

  // 设置侧边栏尺寸和位置
  const sidebarWidth = 0;
  function updateBrowserViewsSize() {
    const bounds = mainWindow.getBounds();
    // sidebarView.setBounds({
    //   x: 0,
    //   y: 0,
    //   width: sidebarWidth,
    //   height: bounds.height
    // });
    mainView.setBounds({
      x: sidebarWidth,
      y: 0,
      // width: bounds.width - sidebarWidth,
      width: bounds.width,
      height: bounds.height
    });
  }

  // 监听窗口大小变化
  mainWindow.on('resize', updateBrowserViewsSize);
  updateBrowserViewsSize();

  // 加载侧边栏
  // sidebarView.webContents.loadFile(path.join(__dirname, 'sidebar.html'));

  // 初始化并加载 wiki 到主视图
  initWiki(wikiPath);

  mainView.webContents.loadURL(`http://localhost:${DEFAULT_PORT}`);

  const menu = Menu.buildFromTemplate([

    {
      label: "文件",
      submenu: [
        {
          label: "打开 Wiki",
          click: openFolderDialog,
        },
        {
          label: "构建 Wiki",
          click: buildWiki,
        },
        {
          label: "在浏览器中打开",
          click: () => {
            shell.openExternal(`http://localhost:${DEFAULT_PORT}`)
          }
        },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: '开发',
      submenu: [
        // {
        //   label: '打开侧边栏开发工具',
        //   click: () => sidebarView.webContents.openDevTools({ mode: 'right' })
        // },
        {
          label: '打开主视图开发工具',
          click: () => mainView.webContents.openDevTools({ mode: 'right' })
        }
      ]
    }
  ]);
  Menu.setApplicationMenu(menu);
}

// 修改 loadURL 调用
function openFolderDialog() {
  dialog
    .showOpenDialog({
      title: "选择 Wiki 文件夹",
      properties: ["openDirectory"],
    })
    .then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        wikiPath = result.filePaths[0];
        initWiki(wikiPath);
        mainWindow.getBrowserView().webContents.loadURL(`http://localhost:${DEFAULT_PORT}`);
      }
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
