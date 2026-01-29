"use client";

import { useState } from "react";
import { useWallet } from "@/lib/wallet/walletContext";
import { loadEncryptedSeed } from "@/lib/wallet/storage";
import { decryptMnemonic } from "@/lib/crypto/encrypt";
import { useRouter } from "next/navigation";

export default function UnlockPage() {
  const { unlock } = useWallet();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleUnlock() {
    try {
      const encrypted = await loadEncryptedSeed();
      if (!encrypted) {
        setError("No wallet found");
        return;
      }

      const mnemonic = await decryptMnemonic(encrypted, password);
      unlock(mnemonic);               // 🔥 THIS IS THE KEY LINE
      router.push("/wallet");         // go to dashboard
    } catch {
      setError("Wrong password");
    }
  }

  return (
    <div>
      <h1>Unlock Wallet</h1>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleUnlock}>Unlock</button>

      {error && <p>{error}</p>}
    </div>
  );
}
