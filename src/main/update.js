const { autoUpdater } = require('electron-updater');
const {dialog} = require("electron")

function setupAutoUpdater() {
    // 配置自动下载
    autoUpdater.autoDownload = false;

    // 检查更新错误
    autoUpdater.on('error', (error) => {
        dialog.showErrorBox('更新出错', error.message);
    });

    // 检测到新版本
    autoUpdater.on('update-available', async (info) => {
        const { response } = await dialog.showMessageBox({
            type: 'info',
            title: '发现新版本',
            message: `发现新版本 ${info.version}，是否更新？`,
            buttons: ['更新', '取消']
        });

        if (response === 0) {
            autoUpdater.downloadUpdate();
        }
    });

    // 没有新版本
    autoUpdater.on('update-not-available', () => {
        dialog.showMessageBox({
            title: '没有新版本',
            message: '当前已经是最新版本'
        });
    });

    // 下载进度
    autoUpdater.on('download-progress', (progressObj) => {
        // 可以在这里添加下载进度提示
        const log_message = `下载速度：${progressObj.bytesPerSecond} - 已下载 ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
        console.log(log_message);
    });

    // 更新下载完成
    autoUpdater.on('update-downloaded', async () => {
        const { response } = await dialog.showMessageBox({
            title: '安装更新',
            message: '更新已下载，应用将重启并安装',
            buttons: ['现在重启', '稍后重启']
        });

        if (response === 0) {
            autoUpdater.quitAndInstall(false);
        }
    });
}

// 检查更新
function checkForUpdates() {
    console.log('update check')
    autoUpdater.checkForUpdates().catch(err => {
        dialog.showErrorBox('更新检查失败', err.message);
    });
}

module.exports = {
    setupAutoUpdater,
    checkForUpdates
}