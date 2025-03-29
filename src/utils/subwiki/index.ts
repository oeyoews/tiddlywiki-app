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
    await fs.ensureSymlink(targetPath, symlinkPath);
    log.info(
      `successfully create subwiki softlink: ${symlinkPath} -> ${targetPath}`
    );
  } catch (error) {
    log.error(`failed to create softlink:`, error);
    throw error;
  }
}
