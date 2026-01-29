// lib/crypto/address.ts

import { bech32 } from "bech32";
import { createHash } from "crypto";

/**
 * HASH160 = RIPEMD160(SHA256(pubkey))
 */
function hash160(buffer: Buffer): Buffer {
  const sha = createHash("sha256").update(buffer).digest();
  return createHash("ripemd160").update(sha).digest();
}

/**
 * Convert public key → WORP bech32 address
 */
export function pubkeyToWorpAddress(
  pubkey: Buffer
): string {
  
  const network =
    (process.env.NEXT_PUBLIC_WORP_NETWORK as
      | "regtest"
      | "testnet"
      | "mainnet") ?? "regtest";

  const hrp =
    network === "regtest"
      ? "rworp"
      : network === "testnet"
      ? "tworp"
      : "worp";

  const pubkeyHash = hash160(pubkey);

  // SegWit v0
  const words = bech32.toWords(pubkeyHash);
  words.unshift(0);

  return bech32.encode(hrp, words);
}


/**
 * Convert WORP address → scriptPubKey
 * Supports:
 *  - P2WPKH (bech32: worp / tworp / rworp)
 */
export function addressToScriptPubKey(address: string): Buffer {
  const { prefix, words } = bech32.decode(address);

  // Validate HRP
  if (!["worp", "tworp", "rworp"].includes(prefix)) {
    throw new Error("Invalid WORP bech32 address");
  }

  // witness version
  const version = words[0];
  if (version !== 0) {
    throw new Error("Unsupported witness version");
  }

  const program = Buffer.from(bech32.fromWords(words.slice(1)));

  if (program.length !== 20) {
    throw new Error("Invalid witness program length");
  }

  // scriptPubKey = OP_0 <20-byte pubkeyhash>
  return Buffer.concat([
    Buffer.from([0x00, 0x14]),
    program
  ]);
}
