export function generateId(str: string) {
  // 使用简单的哈希算法来生成短 id
  return str
    .split('')
    .reduce((hash, char) => {
      return (hash << 5) - hash + char.charCodeAt(0); // 类似于 JavaScript 内置的哈希函数
    }, 0)
    .toString(16);
}
