import { sha256 } from '@bitauth/libauth';
import bs58check from 'bs58check';

export function toWIF(privateKey: Uint8Array): string {
  const versionByte = Uint8Array.from([0x80]); // mainnet WIF prefix
  const compressedFlag = Uint8Array.from([0x01]); // compressed key

  // Payload = 0x80 + privateKey + 0x01
  const payload = Uint8Array.from([
    ...versionByte,
    ...privateKey,
    ...compressedFlag,
  ]);

  // Base58Check encoding = Base58(payload + checksum(sha256^2))
  return bs58check.encode(payload);
}
