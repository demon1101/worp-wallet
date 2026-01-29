"use client";

import type { WalletUtxo } from "@/lib/wallet/utxos.electrum";
import * as bitcoin from "bitcoinjs-lib";

const COINBASE_MATURITY = 100;
const COINBASE_TXID =
  "0000000000000000000000000000000000000000000000000000000000000000";

export async function filterSpendableUtxos(
  utxos: WalletUtxo[]
): Promise<WalletUtxo[]> {
  if (utxos.length === 0) return [];

  // dedupe txids
  const txids = [...new Set(utxos.map(u => u.txid))];

  /* --------------------------------------------------
   * Fetch raw txs via API (SERVER does Electrum)
   * -------------------------------------------------- */
  const res = await fetch("/api/txraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txids }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch raw transactions");
  }

  const { rawTxs } = (await res.json()) as {
    rawTxs: string[];
  };

  // detect coinbase txids (UNCHANGED LOGIC)
  const coinbaseTxids = new Set<string>();

  for (let i = 0; i < txids.length; i++) {
    const tx = bitcoin.Transaction.fromHex(rawTxs[i]);

    const isCoinbase =
      tx.ins.length === 1 &&
      Buffer.from(tx.ins[0].hash)
        .reverse()
        .toString("hex") === COINBASE_TXID;

    if (isCoinbase) {
      coinbaseTxids.add(txids[i]);
    }
  }

  // filter spendable utxos (UNCHANGED LOGIC)
  return utxos.filter((u) => {
    if (u.confirmations < 1) return false;

    if (coinbaseTxids.has(u.txid)) {
      return u.confirmations >= COINBASE_MATURITY;
    }

    return true;
  });
}
