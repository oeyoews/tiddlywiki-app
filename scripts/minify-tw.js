const fs = require('fs');
const path = require('path');

const editionsPath = path.join(
  __dirname,
  '../node_modules/tiddlywiki/editions'
);

function deleteEditionsExceptServer() {
  if (fs.existsSync(editionsPath)) {
    fs.readdirSync(editionsPath).forEach((dir) => {
      const dirPath = path.join(editionsPath, dir);
      if (fs.statSync(dirPath).isDirectory() && dir !== 'server') {
        fs.rmSync(dirPath, { recursive: true, force: true });
        console.log(`Deleted: ${dirPath}`);
      }
    });
  } else {
    console.log(`Path not found: ${editionsPath}`);
  }
}

deleteEditionsExceptServer();
