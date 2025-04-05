import os from 'os';
import { NetworkInterfaceInfo } from 'os';

export const getAllLocalIPv4Addresses = (): string[] => {
  const interfaces = os.networkInterfaces();

  return Object.values(interfaces)
    .flatMap((ifaceList: NetworkInterfaceInfo[] | undefined) =>
      ifaceList ? ifaceList : []
    )
    .filter(
      (iface: NetworkInterfaceInfo) =>
        iface.family === 'IPv4' && !iface.internal && !!iface.address
    )
    .map((iface: NetworkInterfaceInfo) => iface.address!);
};
