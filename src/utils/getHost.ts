import os from 'os';
import { NetworkInterfaceInfo } from 'os';

export const getLocalIPAddress = (): string | null => {
  const interfaces = os.networkInterfaces();

  return (
    Object.values(interfaces)
      .flatMap((ifaceList: NetworkInterfaceInfo[] | undefined) =>
        ifaceList ? ifaceList : []
      )
      .find(
        (iface: NetworkInterfaceInfo) =>
          iface.family === 'IPv4' && !iface.internal
      )?.address || null
  );
};
