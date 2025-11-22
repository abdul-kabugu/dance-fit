import { CashAddressType, encodeCashAddress, hash160 } from '@bitauth/libauth';
import { HDKey } from '@scure/bip32';
import { generateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * Generate a new organizer wallet (mnemonic + xprv + xpub)
 */
export function generateOrganizerWallet() {
  // 1. Generate 12-word mnemonic
  const mnemonic = generateMnemonic(wordlist, 128);

  // 2. Convert mnemonic to seed
  const seed = mnemonicToSeedSync(mnemonic);

  // 3. Create master HD root
  const root = HDKey.fromMasterSeed(seed);

  // Standard BCH path: m/44'/145'/0'
  const accountNode = root.derive("m/44'/145'/0'");

  // Extract extended keys
  const xprv = accountNode.toJSON().xpriv!;
  const xpub = accountNode.toJSON().xpub!;

  return { mnemonic, xprv, xpub };
}

export function deriveBchAddressFromXpub(xpub: string, index: number) {
  const hd = HDKey.fromExtendedKey(xpub);

  // Derive receiving address — path m/0/index
  const child = hd.derive(`m/0/${index}`);
  if (!child.publicKey) {
    throw new Error('Could not derive pubkey');
  }

  // Compute HASH160(pubkey)
  const pubkeyHash = hash160(child.publicKey);

  // Encode as bitcoincash: cashaddr
  const address = encodeCashAddress({
    prefix: 'bitcoincash',
    type: CashAddressType.p2pkh,
    payload: pubkeyHash,
  });
  return address;
}

// ...existing code...
export function derivePrivateWalletAddress2(
  xprv: string,
  index: number,
): ReturnType<typeof encodeCashAddress> {
  const master = HDKey.fromExtendedKey(xprv);
  const child = master.derive(`m/0/${index}`);

  if (!child.publicKey) {
    throw new Error('Could not derive public key from xprv');
  }

  const pubkeyHash = hash160(child.publicKey);

  const address = encodeCashAddress({
    prefix: 'bitcoincash',
    type: CashAddressType.p2pkh,
    payload: pubkeyHash,
  });
  return address.address;
}
// ...existing code...
