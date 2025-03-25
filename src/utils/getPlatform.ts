const platform = process.platform;

export function getPlatform() {
  let osType: IPlatform = 'windows';
  if (platform === 'linux') {
    osType = 'linux';
  } else if (platform === 'win32') {
    osType = 'windows';
  } else if (platform === 'darwin') {
    osType = 'macOS';
  }
  return osType;
}
