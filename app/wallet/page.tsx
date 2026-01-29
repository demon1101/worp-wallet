// app/wallet/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useWallet } from "@/lib/wallet/walletContext";
import { getBalance } from "@/lib/wallet/getBalance.client";
import { buildTxHistory } from "@/lib/wallet/txHistory.client";
import { getReceiveAddress } from "@/lib/wallet/getReceiveAddress.client";

const SATS_PER_WORP = 100_000_000;

type UiTx = {
  txid: string;
  type: "sent" | "received" | "self";
  amount: string; // bigint → string
  fee: string;    // bigint → string
  confirmations: number;
  height: number;
};

export default function WalletDashboard() {
  const router = useRouter();
  const { mnemonic, isUnlocked } = useWallet();

  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<UiTx[]>([]);
  const [receiveAddress, setReceiveAddress] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* 🔒 redirect if wallet is locked */
  useEffect(() => {
    if (!isUnlocked) {
      router.push("/wallet/unlock");
    }
  }, [isUnlocked, router]);

  /* 🔄 load wallet data */
  useEffect(() => {
    if (!mnemonic) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [bal, history] = await Promise.all([
          getBalance(mnemonic),
          buildTxHistory(mnemonic),
        ]);

        setBalance(bal);

        setTxs(
          history.map((t) => ({
            ...t,
            amount: t.amount.toString(),
            fee: t.fee.toString(),
          }))
        );

        // receive address (index 0)
        setReceiveAddress(getReceiveAddress(mnemonic, 0));
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Wallet load failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [mnemonic]);

  if (!isUnlocked) return null;
  if (loading) return <p>Loading wallet…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1>WORPLINK Wallet</h1>

      {/* Balance */}
      <section>
        <h2>Balance</h2>
        <p className="text-xl">
          <strong>{(balance / SATS_PER_WORP).toFixed(8)}</strong> WORP
        </p>
      </section>

      {/* Receive */}
      <section>
        <h2>Receive Address</h2>
        <pre className="p-4 bg-[#111] text-[#0f0] overflow-x-auto">
          {receiveAddress}
        </pre>
      </section>

      {/* Actions */}
      <section style={{ marginTop: 20 }}>
        <button onClick={() => router.push("/wallet/send")}>
          Send WORP
        </button>
      </section>

      {/* Transactions */}
      <section className="mt-4">
        <h2>Transactions</h2>

        {txs.length === 0 && <p>No transactions yet</p>}

        <ul>
          {txs.map((tx) => {
            const amountWorp =
              Number(tx.amount) / SATS_PER_WORP;

            return (
              <li key={tx.txid}>
                {tx.type === "received" && "⬇ Received"}
                {tx.type === "sent" && "⬆ Sent"}
                {tx.type === "self" && "↻ Self transfer"}{" "}
                {amountWorp.toFixed(8)} WORP
                <br />
                <small>
                  {tx.confirmations} conf —{" "}
                  {tx.txid.slice(0, 12)}…
                </small>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
