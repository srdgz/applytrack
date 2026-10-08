const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

export const usesPrivateIpHost = (url: string): boolean => {
  const host = /^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+)/i.exec(url)?.[1] ?? "";
  return IPV4.test(host) && !host.startsWith("127.");
};
