// lib/electrum/client.server.ts
// Server-only Electrum client via Node API

const NODE_API_URL =
  process.env.WORP_NODE_API_URL ?? "http://127.0.0.1:8080";

const NODE_API_KEY = process.env.WORP_NODE_API_KEY;

if (!NODE_API_KEY) {
  throw new Error("WORP_NODE_API_KEY not set");
}

type NodeApiResponse<T> = {
  result: T;
};

type ElectrumBatchItem = {
  method: string;
  params: any[];
};

/* ---------------------------------------------
 * Single call (keep this!)
 * -------------------------------------------*/
export async function electrumCall<T = any>(
  method: string,
  params: any[] = []
): Promise<T> {
  const res = await fetch(`${NODE_API_URL}/electrum`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NODE_API_KEY}`,
    },
    body: JSON.stringify({ method, params }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Node API electrum error: ${text}`);
  }

  const data = (await res.json()) as NodeApiResponse<T>;

  if (!data || !("result" in data)) {
    throw new Error("Invalid node-api electrum response");
  }

  return data.result;
}

/* ---------------------------------------------
 * Batch call
 * -------------------------------------------*/
export async function electrumCallBatch<T = any>(
  calls: ElectrumBatchItem[]
): Promise<T[]> {
  const res = await fetch(`${NODE_API_URL}/electrum`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NODE_API_KEY}`,
    },
    body: JSON.stringify(calls),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Node API electrum batch error: ${text}`);
  }

  const data = (await res.json()) as NodeApiResponse<T>[];

  return data.map((r) => r.result);
}
