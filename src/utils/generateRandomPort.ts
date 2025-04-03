export function generateRandomPrivatePort() {
  return Math.floor(Math.random() * (65535 - 49152 + 1)) + 49152;
}
