const fs = require("fs");

// 检查目录是否为空
function isEmptyDirectory(directoryPath) {
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
module.exports = {isEmptyDirectory}