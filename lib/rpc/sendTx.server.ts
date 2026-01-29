// lib/rpc/sendTx.server.ts

const NODE_API_URL = process.env.WORP_NODE_API_URL!;
const NODE_API_KEY = process.env.WORP_NODE_API_KEY!;

export async function sendRawTransaction(
  rawTxHex: string
): Promise<string> {
  const res = await fetch(`${NODE_API_URL}/rpc/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NODE_API_KEY}`,
    },
    body: JSON.stringify({ rawTx: rawTxHex }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Node API send error: ${text}`);
  }

  const data = (await res.json()) as { result: string };
  return data.result;
}
