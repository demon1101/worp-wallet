// app/wallet/signtx/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useWallet } from "@/lib/wallet/walletContext";
import { signClientTx } from "@/lib/wallet/signtx.client";

export default function SignTxPage() {
  const router = useRouter();
  const { mnemonic, isUnlocked } = useWallet();

  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔒 redirect safely */
  useEffect(() => {
    if (!isUnlocked) {
      router.push("/wallet/unlock");
    }
  }, [isUnlocked, router]);

  if (!isUnlocked) return null;

  async function signTx() {
    if (!mnemonic) return;

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const rawTxHex = await signClientTx({
        mnemonic,
        to,
        amountWorp: Number(amount),
      });

      setResult(rawTxHex);
    } catch (err: any) {
      setError(err.message || "Failed to sign transaction");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[500px] mx-auto">
      <h1>Sign Transaction</h1>

      <input
        className="w-full mb-2"
        placeholder="Receiver address"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />

      <input
        className="w-full mb-2"
        placeholder="Amount (WORP)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <button onClick={signTx} disabled={loading}>
        {loading ? "Signing…" : "Sign Tx"}
      </button>

      {error && (
        <p className="mt-4">
          {error}
        </p>
      )}

      {result && (
        <textarea
          className="w-full h-[150px] mt-6 border p-2"
          readOnly
          value={result}
        />
      )}
    </div>
  );
}
