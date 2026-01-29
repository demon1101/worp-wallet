"use client";

import {
  mnemonicToRoot,
  deriveAccountNode,
  deriveReceiveNode,
  deriveChangeNode,
} from "@/lib/crypto/hd";

import { pubkeyToWorpAddress } from "@/lib/crypto/address";

const GAP_LIMIT = 20;

export function deriveAddresses(
  mnemonic: string
): string[] {
  const root = mnemonicToRoot(mnemonic);
  const account = deriveAccountNode(root);

  const receive = deriveReceiveNode(account);
  const change = deriveChangeNode(account);

  const addresses: string[] = [];

  for (let i = 0; i < GAP_LIMIT; i++) {
    const r = receive.derive(i);
    const c = change.derive(i);

    addresses.push(
      pubkeyToWorpAddress(Buffer.from(r.publicKey)),
      pubkeyToWorpAddress(Buffer.from(c.publicKey))
    );
  }

  return addresses;
}
