import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-3xl px-8 py-24 space-y-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-zinc-50">
          WORPLINK
        </h1>

        <div className="flex justify-center gap-6 pt-2">
          <Link
            href="/wallet"
            className="text-black dark:text-zinc-50"
          >
            Open Wallet
          </Link>

          <Link
            href="/docs/payments"
            className="text-black dark:text-zinc-50"
          >
            Payment API Docs
          </Link>
        </div>
      </div>
    </main>
  );
}
