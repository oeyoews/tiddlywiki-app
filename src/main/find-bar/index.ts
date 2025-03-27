// @ts-nocheck
// from: copyed fron npm package find-bar
// patch: remove esc shortcut register for tiddlywiki
import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';

const isMac = process.platform === 'darwin';
const BAR_WIDTH = 376;
const BAR_HEIGHT = 48;
const DEFAULT_LEFT = 80;
const DEFAULT_RIGHT = isMac ? 20 : 30;
let editorMatchedCount = 0;

const showWin = (win) => {
  if (win.isMinimized()) {
    win.restore();
  }
  win.show();
  win.focus();
  win.webContents.send('find-show');
};

const getPosition = (win, options) => {
  const pos = win.getBounds();
  const { left, right, top, bottom } = options || {};
  const result = {};
  if (left > 0) {
    result.x = pos.x + left;
  } else {
    result.x =
      pos.x + pos.width - BAR_WIDTH - (right > 0 ? right : DEFAULT_LEFT);
  }
  if (bottom > 0) {
    result.y = pos.y + pos.height - BAR_HEIGHT - bottom;
  } else {
    result.y = pos.y + (top > 0 ? top : DEFAULT_RIGHT);
  }
  return result;
};

const createFindBar = (win, options, hideFindBar) => {
  const findBar = new BrowserWindow({
    parent: win,
    width: BAR_WIDTH,
    height: BAR_HEIGHT,
    title: 'Find',
    resizable: false,
    movable: false,
    autoHideMenuBar: true,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false,
    },
    ...getPosition(win, options),
  });
  findBar.once('ready-to-show', () => findBar.show());
  const focusInput = () => {
    findBar.webContents.send('find-show');
  };
  const cleanup = () => {
    globalShortcut.unregister('CommandOrControl+F', focusInput);
    // globalShortcut.unregister('ESC', hideFindBar);
  };
  findBar._isFindBar = true;
  findBar.on('focus', () => {
    cleanup();
    globalShortcut.register('CommandOrControl+F', focusInput);
    // globalShortcut.register('ESC', hideFindBar);
  });
  findBar.on('blur', cleanup);
  findBar.once('closed', cleanup);
  return findBar;
};

app.on('window-all-closed', () => {
  globalShortcut.unregister('CommandOrControl+F');
  // globalShortcut.unregister('ESC');
});

let index = 0;

export const setFindBar = (win, options) => {
  if (win._hasFindBar || win._isFindBar) {
    return;
  }
  win._hasFindBar = true;
  const hash = `#${Math.floor(Math.random() * 100000)}/${++index}`;
  const search =
    options && options.darkMode === false ? '?disabledDarkMode' : '';
  const FIND_CLOSE = `find-close${hash}`;
  const FIND_START = `find-start${hash}`;
  const FIND_PREV = `find-prev${hash}`;
  const FIND_NEXT = `find-next${hash}`;
  let findBar;
  let timer;
  let curReqId;
  let curWord = '';
  let curSeq = -1;
  let preText = '';

  const findStop = () => {
    preText = '';
    win.webContents.stopFindInPage('clearSelection');
    if (findBar) {
      findBar.webContents.send('find-result');
    }
  };

  const hideFindBar = () => {
    if (findBar) {
      findBar.hide();
    }
    findStop();
  };
  const showFindBar = () => {
    if (findBar) {
      return showWin(findBar);
    }
    findBar = createFindBar(win, options, hideFindBar);
    const setPosition = () => {
      timer = null;
      const pos = getPosition(win, options);
      findBar.setPosition(pos.x, pos.y);
    };
    const debounce = () => {
      timer = timer || setTimeout(setPosition, 30);
    };
    setPosition();
    win.on('resize', debounce);
    if (!isMac) {
      win.on('move', debounce);
    }
    findBar.once('closed', () => {
      findBar = null;
    });

    const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
    process.env.APP_ROOT = path.join(__dirname, '../..');
    process.env.DIST = path.join(process.env.APP_ROOT, 'dist');
    process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
      ? path.join(process.env.APP_ROOT, 'public')
      : process.env.DIST;
    findBar.loadFile(path.join(process.env.VITE_PUBLIC, 'find.html'), {
      hash,
      search,
    });
  };
  const findInPage = async (opts) => {
    editorMatchedCount = 0;
    if (curWord) {
      if (typeof win.onBeforeFindInPage === 'function') {
        editorMatchedCount =
          +(await win.onBeforeFindInPage(curWord, opts)) || 0;
      }
      curReqId = win.webContents.findInPage(curWord, opts);
    } else {
      curReqId = null;
      findStop();
    }
  };
  const findStart = (_, { value, seq }) => {
    if (!(seq > curSeq)) {
      return;
    }
    curSeq = seq;
    curWord = value;
    if (curWord !== preText) {
      findInPage({ forward: true, findNext: true });
    }
  };
  const findNext = () => {
    findInPage({ forward: true, findNext: false });
  };
  const findPrev = () => {
    findInPage({ forward: false, findNext: false });
  };
  const cleanup = () => {
    globalShortcut.unregister('CommandOrControl+F', showFindBar);
    // globalShortcut.unregister('ESC', hideFindBar);
  };
  const handleFocus = () => {
    cleanup();
    globalShortcut.register('CommandOrControl+F', showFindBar);
    // globalShortcut.register('ESC', hideFindBar);
  };
  if (win.isFocused()) {
    handleFocus();
  }
  win.on('focus', handleFocus);
  win.webContents.on('found-in-page', (_, result) => {
    if (result.finalUpdate && curReqId === result.requestId) {
      preText = result.matches ? curWord : null;
      if (findBar) {
        findBar.webContents.send('find-result', {
          activeMatchOrdinal: result.activeMatchOrdinal,
          matches: Math.max(editorMatchedCount, result.matches),
        });
      }
    }
  });
  win.on('blur', cleanup);
  win.once('closed', () => {
    cleanup();
    ipcMain.off(FIND_CLOSE, hideFindBar);
    ipcMain.off(FIND_START, findStart);
    ipcMain.off(FIND_PREV, findPrev);
    ipcMain.off(FIND_NEXT, findNext);
    try {
      findBar.destroy();
    } catch (e) {}
    findBar = null;
  });
  ipcMain.on(FIND_CLOSE, hideFindBar);
  ipcMain.on(FIND_START, findStart);
  ipcMain.on(FIND_PREV, findPrev);
  ipcMain.on(FIND_NEXT, findNext);
  return showFindBar;
};
