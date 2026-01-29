"use client";

import React, { createContext, useContext, useState } from "react";

interface WalletContextType {
  mnemonic: string | null;
  isUnlocked: boolean;
  unlock: (mnemonic: string) => void;
  lock: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  function unlock(mnemonic: string) {
    setMnemonic(mnemonic);
  }

  function lock() {
    setMnemonic(null);
  }

  return (
    <WalletContext.Provider
      value={{
        mnemonic,
        isUnlocked: mnemonic !== null,
        unlock,
        lock,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return ctx;
}
