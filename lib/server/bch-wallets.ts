//'use server';
import { mnemonicToSeedSync } from '@scure/bip39';
import { createCipheriv, randomBytes } from 'crypto';

import { generateOrganizerWallet } from '@/lib/bch-wallets';

type BchWalletSecrets = {
  bchXpub: string;
  bchXprivEnc: string;
  bchSeedEnc: string;
};

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function resolveEncryptionKey() {
  const key = process.env.BCH_WALLET_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'Missing BCH_WALLET_ENCRYPTION_KEY env. Cannot encrypt wallet secrets.',
    );
  }

  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) {
    throw new Error(
      'BCH_WALLET_ENCRYPTION_KEY must be a 32-byte base64-encoded string.',
    );
  }
  return buffer;
}

function encryptBuffer(data: Buffer | Uint8Array) {
  const key = resolveEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

function encryptString(value: string) {
  return encryptBuffer(Buffer.from(value, 'utf8'));
}

export function createEncryptedBchWallet(): BchWalletSecrets {
  const wallet = generateOrganizerWallet();
  const seed = mnemonicToSeedSync(wallet.mnemonic);

  return {
    bchXpub: wallet.xpub,
    bchXprivEnc: encryptString(wallet.xprv),
    bchSeedEnc: encryptBuffer(seed),
  };
}
