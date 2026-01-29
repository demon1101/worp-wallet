import { NextRequest, NextResponse } from "next/server";
import { electrumCall } from "@/lib/electrum/client.server";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ??
      "unknown";

    const rl = rateLimit(`headers-ip:${ip}`, 120, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const header = await electrumCall<{ height: number }>(
      "blockchain.headers.subscribe",
      []
    );

    return NextResponse.json({ height: header.height });
  } catch (err: any) {
    console.error("HEADERS ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch headers" },
      { status: 500 }
    );
  }
}
