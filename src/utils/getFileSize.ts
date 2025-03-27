import fs from 'fs';

export function getFileSizeInMB(filePath: string): string | null {
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInMB: number = stats.size / (1024 * 1024); // 转换为MB
    return `${fileSizeInMB.toFixed(2)}M`; // 保留两位小数
  } catch (error) {
    console.error((error as Error).message);
    return null;
  }
}
