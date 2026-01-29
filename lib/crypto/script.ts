import * as bitcoin from "bitcoinjs-lib";
import { createHash } from "crypto";

// WORP regtest network params (SegWit bech32)
const NETWORK = bitcoin.networks.regtest;

/**
 * Convert scriptPubKey → address
 * Returns null if script is non-standard or not decodable
 */
export function scriptToAddress(script: Buffer): string | null {
  try {
    return bitcoin.address.fromOutputScript(script, NETWORK);
  } catch {
    return null;
  }
}


/**
 * Convert scriptPubKey → Electrum scripthash
 * (SHA256(script) then byte-reverse, hex)
 */
export function scriptToScripthash(script: Buffer): string {
  const hash = createHash("sha256").update(script).digest();
  return Buffer.from(hash.reverse()).toString("hex");
}
