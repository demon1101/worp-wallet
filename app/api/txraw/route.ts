import { NextRequest, NextResponse } from "next/server";
import { electrumCallBatch } from "@/lib/electrum/client.server";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = rateLimit(`txraw-ip:${ip}`, 60, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { txids } = (await req.json()) as {
      txids: string[];
    };

    if (!Array.isArray(txids) || txids.length === 0) {
      return NextResponse.json(
        { error: "txids[] required" },
        { status: 400 }
      );
    }

    const rawTxs = await electrumCallBatch<string>(
      txids.map((txid) => ({
        method: "blockchain.transaction.get",
        params: [txid, false],
      }))
    );

    return NextResponse.json({ rawTxs });
  } catch (err: any) {
    console.error("TXRAW ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch raw txs" },
      { status: 500 }
    );
  }
}
