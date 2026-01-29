// app/api/confirmations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { corsHeaders, corsPreflight } from "@/lib/http/cors";

import { electrumCall } from "@/lib/electrum/client.server";
import { addressToScriptPubKey } from "@/lib/crypto/address";
import { scriptToScripthash } from "@/lib/crypto/script";
import { rateLimit } from "@/lib/rateLimit";

/* --------------------------------------------------
 * Helper: JSON with CORS
 * -------------------------------------------------- */
function corsJson(data: any, status: number, origin: string | null) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders(origin),
  });
}

/* --------------------------------------------------
 * CORS
 * -------------------------------------------------- */
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return corsPreflight(origin);
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    /* --------------------------------------------------
     * 0️⃣ Rate limit (per IP, per payment)
     * -------------------------------------------------- */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

    const { searchParams } = new URL(req.url);
    const txid = searchParams.get("txid");
    const address = searchParams.get("address");

    if (!txid || !address) {
      return corsJson(
        { error: "txid and address required" },
        400,
        origin
      );
    }

    // 10 calls / min / (txid + address + ip)
    const rl = rateLimit(
      `confirm:${ip}:${txid}:${address}`,
      10,
      60_000
    );

    if (!rl.ok) {
      return corsJson(
        { error: "Rate limit exceeded" },
        429,
        origin
      );
    }

    /* ---------------------------------------------
     * 1. Current chain height
     * -------------------------------------------*/
    const header = await electrumCall(
      "blockchain.headers.subscribe",
      []
    );

    const currentHeight: number = header.height;

    /* ---------------------------------------------
     * 2. address → scripthash
     * -------------------------------------------*/
    const script = addressToScriptPubKey(address);
    const scripthash = scriptToScripthash(script);

    /* ---------------------------------------------
     * 3. Find tx in address history
     * -------------------------------------------*/
    const history = await electrumCall(
      "blockchain.scripthash.get_history",
      [scripthash]
    );

    const entry = history.find(
      (h: any) => h.tx_hash === txid
    );

    const height = entry?.height ?? 0;

    /* ---------------------------------------------
     * 4. Confirmations
     * -------------------------------------------*/
    const confirmations =
      height > 0 ? currentHeight - height + 1 : 0;

    return corsJson(
      { confirmations },
      200,
      origin
    );
  } catch (err: any) {
    console.error("CONFIRMATION ERROR:", err);

    return corsJson(
      { error: err.message || "Failed to fetch confirmations" },
      500,
      origin
    );
  }
}
