import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { sendRawTransaction } from "@/lib/rpc/sendTx.server";

export async function POST(req: NextRequest) {
  try {
    /* --------------------------------------------------
     * Rate limit (IP-based)
     * -------------------------------------------------- */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = rateLimit(`sendrawtx-ip:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    /* --------------------------------------------------
     * Body
     * -------------------------------------------------- */
    const { rawTxHex } = (await req.json()) as {
      rawTxHex: string;
    };

    if (!rawTxHex) {
      return NextResponse.json(
        { error: "rawTxHex required" },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
     * Broadcast ONLY
     * -------------------------------------------------- */
    const txid = await sendRawTransaction(rawTxHex);

    return NextResponse.json({ txid });
  } catch (err: any) {
    console.error("SEND RAW TX ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Broadcast failed" },
      { status: 500 }
    );
  }
}
