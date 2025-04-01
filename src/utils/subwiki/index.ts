// 给定一个目标文件夹， 和软连接的文件夹， 使用fs-extra进行软连接生成， 如果目标文件夹不存在就手动创建，如果软链接文件夹已存在就跳过

import fs from 'fs-extra';
import { log } from '@/utils/logger';

/**
 * 创建软链接
 * @param targetPath 目标文件夹路径
 * @param symlinkPath 软链接路径
 */
export async function createSymlink(
  targetPath: string,
  symlinkPath: string
): Promise<void> {
  try {
    // 确保目标文件夹存在
    if (!(await fs.pathExists(targetPath))) {
      await fs.mkdirp(targetPath);
    }

    // 检查软链接是否已存在
    if (await fs.pathExists(symlinkPath)) {
      log.info(`softlink ${symlinkPath} has exist, skip`);
      return;
    }

    // 创建软链接
    await fs.ensureSymlink(targetPath, symlinkPath, 'junction');
    log.info(
      `successfully create subwiki softlink: ${symlinkPath} -> ${targetPath}`
    );
  } catch (error) {
    log.error(`failed to create softlink:`, error);
    throw error;
  }
}

// TODO: 检查subwiki 是否有效， 如果无效就创建
/**
 * 检查软链接是否有效
 * @param symlinkPath 软链接路径
 * @returns 是否有效
 */
export async function isSymlinkValid(symlinkPath: string): Promise<boolean> {
  try {
    if (!(await fs.pathExists(symlinkPath))) {
      log.info(`softlink ${symlinkPath} does not exist`);
      return false;
    }

    const stats = await fs.lstat(symlinkPath);
    if (!stats.isSymbolicLink()) {
      log.info(`${symlinkPath} is not a symlink`);
      return false;
    }

    const target = await fs.readlink(symlinkPath);
    if (!(await fs.pathExists(target))) {
      log.info(`softlink ${symlinkPath} points to invalid target: ${target}`);
      return false;
    }

    log.info(`softlink ${symlinkPath} is valid`);
    return true;
  } catch (error) {
    log.error(`failed to check softlink:`, error);
    return false;
  }
}
