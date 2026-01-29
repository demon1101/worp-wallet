import * as bip39 from "bip39";

/**
 * Generate a new mnemonic for WORPLINK
 * Default: 12 words (128 bits entropy)
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(128);
}

/**
 * Validate a mnemonic entered by user
 * Used during wallet restore
 */
export function validateMnemonic(mnemonic: string): boolean {
  return bip39.validateMnemonic(mnemonic);
}

/**
 * Convert mnemonic into a seed (Level 2 input)
 * This seed is NEVER shown to user
 */
export function mnemonicToSeed(mnemonic: string): Buffer {
  return bip39.mnemonicToSeedSync(mnemonic);
}
