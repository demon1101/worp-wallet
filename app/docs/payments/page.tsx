export const metadata = {
  title: "WORP Payment API",
};

export default function PaymentsDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-20 space-y-12 text-sm text-black dark:text-zinc-50">
      <h1 className="text-3xl font-semibold tracking-tight">
        WORP Payment API
      </h1>

      {/* PAY */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">POST /api/pay</h2>

        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 overflow-x-auto">
{`{
  "rawTxHex": "<signed_tx_hex>",
  "address": "<merchant_address>",
  "amountWorp": 10
}`}
        </pre>

        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 overflow-x-auto">
{`{
  "success": true,
  "txid": "<txid>",
  "amount_paid": 10
}`}
        </pre>
      </section>

      {/* CONFIRMATIONS */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">GET /api/confirmations</h2>

        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 overflow-x-auto">
{`/api/confirmations?txid=<txid>&address=<merchant_address>`}
        </pre>

        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4 overflow-x-auto">
{`{
  "txid": "<txid>",
  "address": "<merchant_address>",
  "height": 112,
  "confirmations": 1
}`}
        </pre>
      </section>

      {/* LIMITS */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium">Rate limits</h2>
        <pre className="bg-zinc-100 dark:bg-zinc-900 p-4">
{`POST /api/pay            → 300 / min / IP
GET  /api/confirmations  → 10 / min / (txid + address + IP)`}
        </pre>
      </section>
    </main>
  );
}
