// app/wallet/layout.ts
"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import { WalletProvider, useWallet } from "@/lib/wallet/walletContext";

function WalletShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isUnlocked } = useWallet();

  const isCreate = pathname === "/wallet/create";
  const isRestore = pathname === "/wallet/restore";
  const isUnlock = pathname === "/wallet/unlock";

  useEffect(() => {
    if (isUnlocked && (isCreate || isRestore)) {
      router.push("/wallet");
      return;
    }

    if (!isUnlocked && !(isCreate || isRestore || isUnlock)) {
      router.push("/wallet/unlock");
    }
  }, [isUnlocked, isCreate, isRestore, isUnlock, router]);

  return (
    <div className="mx-auto max-w-2xl px-4">
      <nav className="mb-5 flex gap-6 border-b border-[#333] pb-3">
        {isUnlocked && (
          <>
            <Link href="/wallet">Dashboard</Link>
            <Link href="/wallet/send">Send</Link>
            <Link href="/wallet/signtx">SignTx</Link>
            <Link href="/wallet/export">Export</Link>
          </>
        )}

        {!isUnlocked && (
          <>
            <Link href="/wallet/create">Create</Link>
            <Link href="/wallet/restore">Restore</Link>
          </>
        )}
      </nav>

      {children}
    </div>
  );
}

export default function WalletLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WalletProvider>
      <WalletShell>{children}</WalletShell>
    </WalletProvider>
  );
}
