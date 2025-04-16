const fs = require('fs-extra');
const path = require('path');

const log = console.log;
/**
 * 创建相对路径的软链接（支持文件）
 * @param targetPath 目标文件路径（将被软链接指向，使用相对路径）
 * @param symlinkPath 软链接路径
 */
async function createRelativeSymlink(targetPath, symlinkPath) {
  try {
    // 计算相对路径
    const relativeTarget = path.relative(path.dirname(symlinkPath), targetPath);

    // 确保目标文件的父目录存在
    const targetDir = path.dirname(targetPath);
    if (!(await fs.pathExists(targetDir))) {
      await fs.mkdirp(targetDir);
    }

    // 检查软链接是否已存在
    if (await fs.pathExists(symlinkPath)) {
      log(`Softlink ${symlinkPath} has exist, skip`);
      return;
    }

    // 创建软链接（相对路径）
    await fs.ensureSymlink(relativeTarget, symlinkPath, 'file');
    log(
      `successfully create relative subwiki softlink: ${symlinkPath} -> ${relativeTarget}`
    );
  } catch (error) {
    log(`failed to create relative softlink:`, error);
    throw error;
  }
}

createRelativeSymlink('./README.md', 'tiddlers/README.md');
createRelativeSymlink('./README.zh-CN.md', 'tiddlers/README.zh-CN.md');
