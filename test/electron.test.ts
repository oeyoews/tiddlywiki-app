// @see: https://playwright.net.cn/docs/api/class-electron
import { _electron } from 'playwright';
import { test, expect } from '@playwright/test';

test('启动 Electron 应用并检查标题', async () => {
  const electronApp = await _electron.launch({ args: ['.'] });

  const window = await electronApp.firstWindow();
  const title = await window.title();

  console.log('应用窗口标题:', title);
  expect(title).toContain('TiddlyWiki5');

  await electronApp.close();
});

test('APP 是否打包', async () => {
  const electronApp = await _electron.launch({ args: ['.'] });
  const isPackaged = await electronApp.evaluate(async ({ app }) => {
    return app.isPackaged;
  });
  console.log('是否打包:', isPackaged ? 'Yes' : 'NO'); // false（因为我们处在开发环境）
  expect(isPackaged).toBe(false);
  // 关闭应用程序
  await electronApp.close();
});
