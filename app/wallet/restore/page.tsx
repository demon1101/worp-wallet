"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { encryptMnemonic } from "@/lib/crypto/encrypt";
import { saveEncryptedSeed } from "@/lib/wallet/storage";
import { validateMnemonic } from "@/lib/crypto/mnemonic"; 

export default function RestoreWalletPage() {
  const router = useRouter();

  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleRestore() {
    try {
      setError(null);

      const normalized = mnemonic
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

      if (!validateMnemonic(normalized)) {
        throw new Error("Invalid mnemonic phrase");
      }

      const encrypted = await encryptMnemonic(normalized, password);
      await saveEncryptedSeed(encrypted);

      setSaved(true);

      // optional: redirect after restore
      setTimeout(() => {
        router.push("/wallet/unlock");
      }, 1000);

    } catch (err: any) {
      setError(err.message || "Failed to restore wallet");
    }
  }

  return (
    <div className="max-w-[500px] mx-auto">
      <h1>Restore Wallet</h1>

      <textarea
        className="w-full mb-2"
        placeholder="Enter your 12 or 24 word recovery phrase"
        rows={4}
        value={mnemonic}
        onChange={e => setMnemonic(e.target.value)}
        
      />

      <input
        className="w-full mb-2"
        type="password"
        placeholder="Set wallet password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={handleRestore}>
        Restore Wallet
      </button>

      {error && (
        <p className="text-red-600 mt-2">
          {error}
        </p>
      )}

      {saved && (
        <p className="mt-2">
          ✅ Wallet restored successfully
        </p>
      )}
    </div>
  );
}
