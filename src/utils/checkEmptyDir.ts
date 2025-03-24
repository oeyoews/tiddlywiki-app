import fs from 'fs';

/** 检查目录是否为空 */
export function isEmptyDirectory(directoryPath: string) {
  try {
    if (!fs.existsSync(directoryPath)) {
      return true;
    }
    const files = fs.readdirSync(directoryPath);
    return files.length === 0;
  } catch (err) {
    console.error('检查目录失败：', err);
    return false;
  }
}
