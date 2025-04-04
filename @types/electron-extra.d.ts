import { electronAPI as IElectronAPI } from '@/preload';

// 获取 electronAPI 的类型
type IElectronAPI = typeof electronAPI; // 这里推断出 electronAPI 的类型
export {};

declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
  interface Window {
    electronAPI: typeof electronAPI; // 使用 typeof 推断 electronAPI 的类型
    // $tw: any;
  }
  // export const $tw: ITiddlyWiki;
  export const electronAPI: typeof IElectronAPI; // 使用 typeof 推断 electronAPI 的类型
}
