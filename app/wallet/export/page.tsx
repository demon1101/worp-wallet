"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet/walletContext";

export default function ExportMnemonicPage() {
  const { mnemonic, isUnlocked } = useWallet();
  const [revealed, setRevealed] = useState(false);

  if (!isUnlocked || !mnemonic) {
    return <p>Wallet must be unlocked</p>;
  }

  return (
    <div>
      <h1>Export Recovery Phrase</h1>

      <p className="text-red-600">
        ⚠ Anyone with this phrase can steal your funds.
      </p>

      {!revealed && (
        <button className="mt-2" onClick={() => setRevealed(true)}>
          Reveal Mnemonic
        </button>
      )}

      {revealed && (
        <pre className="mt-2">
          {mnemonic}
        </pre>
      )}
    </div>
  );
}
