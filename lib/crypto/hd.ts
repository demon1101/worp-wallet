import * as bip39 from "bip39";
import * as bip32 from "bip32";
import * as ecc from "tiny-secp256k1";

const bip32Factory = bip32.BIP32Factory(ecc);

// --------------------
// Level 2
// --------------------

/**
 * mnemomic to root key
 */
export function mnemonicToRoot(mnemonic: string) {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  return bip32Factory.fromSeed(seed);
}

// --------------------
// Level 3
// --------------------

const PURPOSE = 44;
const COIN_TYPE = 1234; // WORP
const ACCOUNT = 0;

/**
 * m / 44' / 1234' / 0'
 * This defines the WORPLINK wallet identity
 */
export function deriveAccountNode(root: bip32.BIP32Interface) {
  const path = `m/${PURPOSE}'/${COIN_TYPE}'/${ACCOUNT}'`;
  return root.derivePath(path);
}

/**
 * m / 44' / 1234' / 0' / 0
 * External (receive) chain
 */
export function deriveReceiveNode(accountNode: bip32.BIP32Interface) {
  return accountNode.derive(0);
}

/**
 * m / 44' / 1234' / 0' / 1
 * Internal (change) chain
 */
export function deriveChangeNode(accountNode: bip32.BIP32Interface) {
  return accountNode.derive(1);
}

/**
 * m / ... / chain / index
 * Final leaf key (private + public)
 */
export function deriveAddressNode(
  chainNode: bip32.BIP32Interface,
  index: number
) {
  return chainNode.derive(index);
}
