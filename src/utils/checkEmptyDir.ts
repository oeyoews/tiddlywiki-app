import fs from 'fs';
import { log } from '@/utils/logger';

/** 检查目录是否为空 */
export function isEmptyDirectory(directoryPath: string) {
  try {
    if (!fs.existsSync(directoryPath)) {
      return true;
    }
    const files = fs.readdirSync(directoryPath);
    return files.length === 0;
  } catch (err) {
    log.error('check dir error：', directoryPath, err);
    return false;
  }
}
