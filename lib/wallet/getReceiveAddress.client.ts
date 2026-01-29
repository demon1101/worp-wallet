// lib/wallet/getReceiveAddress.client.ts
"use client";

import {
  mnemonicToRoot,
  deriveAccountNode,
  deriveReceiveNode,
} from "@/lib/crypto/hd";

import { pubkeyToWorpAddress } from "@/lib/crypto/address";

export function getReceiveAddress(
  mnemonic: string,
  index = 0
): string {
  const root = mnemonicToRoot(mnemonic);
  const account = deriveAccountNode(root);
  const receive = deriveReceiveNode(account);
  const node = receive.derive(index);

  return pubkeyToWorpAddress(
    Buffer.from(node.publicKey)
  );
}
