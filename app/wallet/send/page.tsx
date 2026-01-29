// app/wallet/send/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useWallet } from "@/lib/wallet/walletContext";
import { sendTx } from "@/lib/wallet/send.client";

export default function SendPage() {
  const router = useRouter();
  const { mnemonic, isUnlocked } = useWallet();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* 🔒 redirect safely */
  useEffect(() => {
    if (!isUnlocked) {
      router.push("/wallet/unlock");
    }
  }, [isUnlocked, router]);

  if (!isUnlocked) return null;

  async function send() {
    if (!mnemonic) return;

    try {
      setLoading(true);
      setStatus(null);

      const txid = await sendTx({
        mnemonic,
        to,
        amountWorp: Number(amount),
      });

      setStatus(`Sent ✓ TXID: ${txid}`);
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[500px] mx-auto">
      <h1>Send WORP</h1>

      <input
        className="w-full mb-2"
        placeholder="Recipient address"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <input
        className="w-full mb-2"
        placeholder="Amount (WORP)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={send} disabled={loading}>
        {loading ? "Sending…" : "Send"}
      </button>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
