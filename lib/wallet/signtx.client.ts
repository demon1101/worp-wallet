// lib/wallet/signtx.client.ts
"use client";

import type { WalletUtxo } from "@/lib/wallet/utxos.electrum";

import { filterSpendableUtxos } from "@/lib/wallet/filterSpendableUtxos.client";
import { buildUnsignedTx } from "@/lib/tx/buildTx";
import { signTx } from "@/lib/tx/signTx";

import {
  mnemonicToRoot,
  deriveAccountNode,
  deriveChangeNode,
} from "@/lib/crypto/hd";

import { pubkeyToWorpAddress } from "@/lib/crypto/address";
import { getAccountXpub } from "@/lib/wallet/getXpub.client";

const SATS_PER_WORP = 100_000_000;

type SignParams = {
  mnemonic: string;
  to: string;
  amountWorp: number;
};

export async function signClientTx({
  mnemonic,
  to,
  amountWorp,
}: SignParams): Promise<string> {
  /* --------------------------------------------------
   * 1️⃣ WORP → sats
   * -------------------------------------------------- */
  const amountSats = Math.floor(
    Number(amountWorp) * SATS_PER_WORP
  );
  if (amountSats <= 0) {
    throw new Error("Invalid amount");
  }

  /* --------------------------------------------------
   * 2️⃣ Fetch UTXOs from server
   * -------------------------------------------------- */
  const xpub = getAccountXpub(mnemonic);

  const res = await fetch("/api/utxos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ xpub }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch UTXOs");
  }

  const { utxos } = (await res.json()) as {
    utxos: WalletUtxo[];
  };

  if (utxos.length === 0) {
    throw new Error("No funds available");
  }

  /* --------------------------------------------------
   * 3️⃣ Filter spendable
   * -------------------------------------------------- */
  const spendable = await filterSpendableUtxos(utxos);
  if (spendable.length === 0) {
    throw new Error("Funds not matured yet");
  }

  /* --------------------------------------------------
   * 4️⃣ Change address (m/44'/coin'/0'/1/0)
   * -------------------------------------------------- */
  const root = mnemonicToRoot(mnemonic);
  const account = deriveAccountNode(root);
  const changeNode = deriveChangeNode(account).derive(0);

  const changeAddress = pubkeyToWorpAddress(
    Buffer.from(changeNode.publicKey)
  );

  /* --------------------------------------------------
   * 5️⃣ Build unsigned tx
   * -------------------------------------------------- */
  const unsignedTx = buildUnsignedTx({
    utxos: spendable,
    toAddress: to,
    amount: amountSats,
    changeAddress,
  });

  /* --------------------------------------------------
   * 6️⃣ Sign (CLIENT ONLY)
   * -------------------------------------------------- */
  const rawTxHex = signTx(mnemonic, unsignedTx);

  return rawTxHex;
}
