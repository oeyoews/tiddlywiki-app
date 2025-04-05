import { log } from '@/utils/logger';

/**
 * 将文件路径转换为 VS Code 的 vscode://file/ URI，兼容所有系统。
 *
 * @param filePath 文件路径，例如 "C:\\Users\\YourName\\Documents\\myFile.txt" (Windows) 或 "/Users/yourname/Documents/myFile.txt" (macOS/Linux)。
 * @returns 转换后的 vscode://file/ URI，例如 "vscode://file/C:/Users/YourName/Documents/myFile.txt" 或 "vscode://file//Users/yourname/Documents/myFile.txt"。
 */
export function convertPathToVSCodeUri(filePath: string): string {
  if (!filePath) {
    return '';
  }

  // 统一使用正斜杠作为路径分隔符
  const normalizedPath = filePath.replace(/\\/g, '/');

  // 如果路径以盘符开头（例如 Windows 的 C:/），则保持原样
  // 如果路径以单个正斜杠开头（例如 macOS/Linux 的 /Users），则保持原样
  // 否则，添加一个额外的正斜杠以处理相对路径或不带盘符的 Windows 路径
  let vscodePath = normalizedPath;
  if (!/^[a-zA-Z]:\//.test(normalizedPath) && !/^\//.test(normalizedPath)) {
    // 注意：这里为了兼容性，即使在 Windows 上也可能出现不带盘符的路径
    // 例如，在 WSL 中或者某些构建工具中
    vscodePath = `/${normalizedPath}`;
  }
  log.info('open file(vscode)', `vscode://file/${vscodePath}`);

  return `vscode://file/${vscodePath}`;
}
