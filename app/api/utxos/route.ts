import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import {
  fetchElectrumUtxosByXpub,
} from "@/lib/wallet/utxos.electrum";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      "unknown";

    const rl = rateLimit(`utxos-ip:${ip}`, 60, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const { xpub } = (await req.json()) as {
      xpub: string;
    };

    if (!xpub) {
      return NextResponse.json(
        { error: "xpub required" },
        { status: 400 }
      );
    }

    const utxos = await fetchElectrumUtxosByXpub(xpub);
    return NextResponse.json({ utxos });
  } catch (err: any) {
    console.error("UTXO ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch utxos" },
      { status: 500 }
    );
  }
}
