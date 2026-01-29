// lib/wallet/txHistory.client.ts
"use client";

import * as bitcoin from "bitcoinjs-lib";

import {
  mnemonicToRoot,
  deriveAccountNode,
  deriveReceiveNode,
  deriveChangeNode,
} from "@/lib/crypto/hd";

import {
  pubkeyToWorpAddress,
  addressToScriptPubKey,
} from "@/lib/crypto/address";

import { scriptToScripthash } from "@/lib/crypto/script";

export type TxHistoryItem = {
  txid: string;
  type: "sent" | "received" | "self";
  amount: bigint;
  fee: bigint;
  confirmations: number;
  height: number;
};

type DecodedTx = {
  txid: string;
  vin: {
    txid: string;
    vout: number;
  }[];
  vout: {
    n: number;
    value: bigint; 
    scriptPubKey: { hex: string };
  }[];
};

const GAP_LIMIT = 20;
const COINBASE_TXID =
  "0000000000000000000000000000000000000000000000000000000000000000";

/* --------------------------------------------------
 * Decode tx hex
 * -------------------------------------------------- */
function decodeTxHex(txid: string, hex: string): DecodedTx {
  const tx = bitcoin.Transaction.fromHex(hex);

  return {
    txid,
    vin: tx.ins.map((input) => ({
      txid: Buffer.from(input.hash).reverse().toString("hex"),
      vout: input.index,
    })),
    vout: tx.outs.map((o, i) => ({
      n: i,
      value: o.value, // number (sats)
      scriptPubKey: {
        hex: Buffer.from(o.script).toString("hex"),
      },
    })),
  };
}

/* --------------------------------------------------
 * Build tx history (CLIENT)
 * -------------------------------------------------- */
export async function buildTxHistory(
  mnemonic: string
): Promise<TxHistoryItem[]> {
  /* 1. Derive wallet scripthashes */
  const root = mnemonicToRoot(mnemonic);
  const account = deriveAccountNode(root);
  const receiveNode = deriveReceiveNode(account);
  const changeNode = deriveChangeNode(account);

  const walletScripthashes = new Set<string>();

  for (let i = 0; i < GAP_LIMIT; i++) {
    const rAddr = pubkeyToWorpAddress(
      Buffer.from(receiveNode.derive(i).publicKey)
    );
    const cAddr = pubkeyToWorpAddress(
      Buffer.from(changeNode.derive(i).publicKey)
    );

    walletScripthashes.add(
      scriptToScripthash(addressToScriptPubKey(rAddr))
    );
    walletScripthashes.add(
      scriptToScripthash(addressToScriptPubKey(cAddr))
    );
  }

  /* 2. Fetch histories */
  const historyRes = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scripthashes: [...walletScripthashes] }),
  });

  if (!historyRes.ok) {
    throw new Error("Failed to fetch address histories");
  }

  const { histories } = (await historyRes.json()) as {
    histories: { tx_hash: string; height: number }[][];
  };

  const txHeights = new Map<string, number>();
  for (const history of histories) {
    for (const h of history) {
      txHeights.set(h.tx_hash, h.height);
    }
  }

  if (txHeights.size === 0) return [];

  /* 3. Chain height */
  const headerRes = await fetch("/api/headers");
  if (!headerRes.ok) {
    throw new Error("Failed to fetch chain height");
  }

  const { height: currentHeight } =
    (await headerRes.json()) as { height: number };

  /* 4. Fetch raw txs */
  const txids = [...txHeights.keys()];
  const rawRes = await fetch("/api/txraw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ txids }),
  });

  if (!rawRes.ok) {
    throw new Error("Failed to fetch raw transactions");
  }

  const { rawTxs } = (await rawRes.json()) as { rawTxs: string[] };

  const txMap = new Map<string, DecodedTx>();
  for (let i = 0; i < txids.length; i++) {
    txMap.set(txids[i], decodeTxHex(txids[i], rawTxs[i]));
  }

  /* 5. Collect prev txids */
  const prevTxidSet = new Set<string>();
  for (const tx of txMap.values()) {
    for (const vin of tx.vin) {
      if (vin.txid !== COINBASE_TXID) {
        prevTxidSet.add(vin.txid);
      }
    }
  }

  const prevTxids = [...prevTxidSet].filter(
    (txid) => !txMap.has(txid)
  );

  if (prevTxids.length > 0) {
    const prevRes = await fetch("/api/txraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txids: prevTxids }),
    });

    if (!prevRes.ok) {
      throw new Error("Failed to fetch prev transactions");
    }

    const { rawTxs: prevRawTxs } =
      (await prevRes.json()) as { rawTxs: string[] };

    for (let i = 0; i < prevTxids.length; i++) {
      txMap.set(
        prevTxids[i],
        decodeTxHex(prevTxids[i], prevRawTxs[i])
      );
    }
  }

  /* 6. Analyze & classify */
  const results: TxHistoryItem[] = [];

  for (const [txid, height] of txHeights) {
    const tx = txMap.get(txid)!;

    let inMe = false;
    let outMe = false;

    let inputFromMe = 0n;
    let outputToMe = 0n;
    let outputToOthers = 0n;

    // outputs
    for (const vout of tx.vout) {
      const sh = scriptToScripthash(
        Buffer.from(vout.scriptPubKey.hex, "hex")
      );

      const value = BigInt(vout.value); // ← FIX

      if (walletScripthashes.has(sh)) {
        outMe = true;
        outputToMe += value;
      } else {
        outputToOthers += value;
      }
    }

    // inputs
    for (const vin of tx.vin) {
      if (vin.txid === COINBASE_TXID) continue;

      const prevTx = txMap.get(vin.txid);
      if (!prevTx) continue;

      const prevOut = prevTx.vout[vin.vout];
      if (!prevOut) continue;

      const sh = scriptToScripthash(
        Buffer.from(prevOut.scriptPubKey.hex, "hex")
      );

      if (walletScripthashes.has(sh)) {
        inMe = true;
        inputFromMe += BigInt(prevOut.value); // ← FIX
      }
    }

    let type: TxHistoryItem["type"] | null = null;
    let amount = 0n;
    let fee = 0n;

    if (inMe) {
      if (outputToOthers === 0n) {
        type = "self";
        amount = outputToMe;
      } else {
        type = "sent";
        amount = outputToOthers;
      }
      fee = inputFromMe - (outputToMe + outputToOthers);
    } else if (outMe) {
      type = "received";
      amount = outputToMe;
    }

    if (!type) continue;

    const confirmations =
      height === 0 ? 0 : currentHeight - height + 1;

    results.push({
      txid,
      type,
      amount,
      fee,
      confirmations,
      height,
    });
  }

  /* 7. Sort */
  results.sort((a, b) => {
    if (a.height === 0 && b.height !== 0) return -1;
    if (a.height !== 0 && b.height === 0) return 1;
    return b.height - a.height;
  });

  return results;
}
