// lib/rpc/client.server.ts
// Server-only worpd RPC client via Node API

const NODE_API_URL = process.env.WORP_NODE_API_URL ?? "http://127.0.0.1:8080";
const NODE_API_KEY = process.env.WORP_NODE_API_KEY;

if (!NODE_API_KEY) {
  throw new Error("WORP_NODE_API_KEY not set");
}

type NodeApiRpcResponse<T> = {
  result: T;
};

export async function rpcCall<T = any>(
  method: string,
  params: any[] = []
): Promise<T> {
  const res = await fetch(`${NODE_API_URL}/rpc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NODE_API_KEY}`,
    },
    body: JSON.stringify({
      method,
      params,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Node API rpc error: ${text}`);
  }

  const data = (await res.json()) as NodeApiRpcResponse<T>;

  if (!data || !("result" in data)) {
    throw new Error("Invalid node-api rpc response");
  }

  return data.result;
}
