"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { generateMnemonic } from "@/lib/crypto/mnemonic";
import { encryptMnemonic } from "@/lib/crypto/encrypt";
import {
  saveEncryptedSeed,
  hasEncryptedSeed,
} from "@/lib/wallet/storage";

export default function CreateWalletPage() {
  const router = useRouter();

  const [mnemonic] = useState(generateMnemonic());
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  const [exists, setExists] = useState(false);
  const [deleteOk, setDeleteOk] = useState(false);

  useEffect(() => {
    setExists(hasEncryptedSeed());
  }, []);

  async function handleSave() {
    const encrypted = await encryptMnemonic(mnemonic, password);

    await saveEncryptedSeed(encrypted);
    setSaved(true);

    // optional: redirect after restore
    setTimeout(() => {
      router.push("/wallet/unlock");
    }, 1000);
  }

  return (
    <div>
      <h1>Create Wallet</h1>

      {/* Step 1: wallet exists warning */}
      {exists && !deleteOk && (
        <div>
          <p className="text-red-600">
            ⚠ A wallet already exists.
            Creating a new wallet will permanently delete the old one.
          </p>

          <button onClick={() => setDeleteOk(true)}>
            Yes, delete old wallet
          </button>
        </div>
      )}

      {/* Step 2: actual wallet creation */}
      {(!exists || deleteOk) && (
        <>
          <pre>{mnemonic}</pre>

          <input
            type="password"
            placeholder="Set wallet password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <button onClick={handleSave}>
            Encrypt & Save Wallet
          </button>

          {saved && <p>✅ Wallet saved securely</p>}

          

        </>
      )}
    </div>
  );
}
