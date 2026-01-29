// lib/wallet/getBalance.client.ts
"use client";

import { getAccountXpub } from "@/lib/wallet/getXpub.client";
import type { WalletUtxo } from "@/lib/wallet/utxos.electrum";

export async function getBalance(
  mnemonic: string
): Promise<number> {
  // 1️⃣ Derive xpub locally (never leaves browser as mnemonic)
  const xpub = getAccountXpub(mnemonic);

  // 2️⃣ Fetch UTXOs from server
  const res = await fetch("/api/utxos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ xpub }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch UTXOs");
  }

  const { utxos } = (await res.json()) as {
    utxos: WalletUtxo[];
  };

  // 3️⃣ Balance = sum of UTXOs
  return utxos.reduce(
    (sum, u) => sum + u.value,
    0
  );
}
