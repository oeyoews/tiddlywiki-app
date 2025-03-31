const platform = process.platform;

export function getPlatform() {
  // @ts-ignore
  const osTypes: Record<NodeJS.Platform, string> = {
    win32: 'windows',
    darwin: 'macOs',
    linux: 'linux',
    // cygwin: 'windows',
    // aix: 'linux',
    // freebsd: 'linux',
    // openbsd: 'linux',
    // android: 'linux',
    // haiku: 'linux',
    // sunos: 'linux',
    // netbsd: 'linux',
  };
  return osTypes[platform] || osTypes.win32;
}

function getOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('win')) return 'Windows';
  if (userAgent.includes('mac')) return 'MacOS';
  if (userAgent.includes('linux')) return 'Linux';
  if (
    userAgent.includes('iphone') ||
    userAgent.includes('ipad') ||
    userAgent.includes('ipod')
  )
    return 'iOS';
  if (userAgent.includes('android')) return 'Android';
  return 'Unknown';
}
