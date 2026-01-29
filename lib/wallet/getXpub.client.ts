"use client";

import {
  mnemonicToRoot,
  deriveAccountNode,
} from "@/lib/crypto/hd";

export function getAccountXpub(
  mnemonic: string
): string {
  const root = mnemonicToRoot(mnemonic);
  const account = deriveAccountNode(root);

  // bip32 node already exposes xpub
  return account.neutered().toBase58();
}
