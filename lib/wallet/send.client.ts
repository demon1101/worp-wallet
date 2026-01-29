// lib/wallet/send.client.ts
"use client";

import { signClientTx } from "@/lib/wallet/signtx.client";

type SendParams = {
  mnemonic: string;
  to: string;
  amountWorp: number;
};

export async function sendTx({
  mnemonic,
  to,
  amountWorp,
}: SendParams): Promise<string> {
  /* --------------------------------------------------
   * 1️⃣ Sign locally (delegated)
   * -------------------------------------------------- */
  const rawTxHex = await signClientTx({
    mnemonic,
    to,
    amountWorp,
  });

  /* --------------------------------------------------
   * 2️⃣ Broadcast via server
   * -------------------------------------------------- */
  const sendRes = await fetch("/api/sendrawtx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawTxHex }),
  });

  if (!sendRes.ok) {
    const { error } = await sendRes.json();
    throw new Error(error || "Broadcast failed");
  }

  const { txid } = (await sendRes.json()) as {
    txid: string;
  };

  return txid;
}
