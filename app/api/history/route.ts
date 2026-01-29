import { NextRequest, NextResponse } from "next/server";
import { electrumCallBatch } from "@/lib/electrum/client.server";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      "unknown";

    const rl = rateLimit(`history-ip:${ip}`, 60, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { scripthashes } = (await req.json()) as {
      scripthashes: string[];
    };

    if (!Array.isArray(scripthashes)) {
      return NextResponse.json(
        { error: "scripthashes[] required" },
        { status: 400 }
      );
    }

    const histories = await electrumCallBatch<any[]>(
      scripthashes.map((sh) => ({
        method: "blockchain.scripthash.get_history",
        params: [sh],
      }))
    );

    return NextResponse.json({ histories });
  } catch (err: any) {
    console.error("HISTORY ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch history" },
      { status: 500 }
    );
  }
}
