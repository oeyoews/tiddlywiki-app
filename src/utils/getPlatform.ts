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
