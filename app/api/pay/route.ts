// lib/api/pay/route.ts

import { NextRequest, NextResponse } from "next/server";
import * as bitcoin from "bitcoinjs-lib";

import { sendRawTransaction } from "@/lib/rpc/sendTx.server";
import { addressToScriptPubKey } from "@/lib/crypto/address";

import { rateLimit } from "@/lib/rateLimit";
import { corsHeaders, corsPreflight } from "@/lib/http/cors";

const SATS_PER_WORP = 100_000_000;

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

/* --------------------------------------------------
 * SEND
 * -------------------------------------------------- */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    /* --------------------------------------------------
     * 0️⃣ Rate limit
     * -------------------------------------------------- */
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

    const rl = rateLimit(`pay:${ip}`, 300, 60_000);
    if (!rl.ok) {
      return corsJson({ error: "Rate limit exceeded" }, 429, origin);
    }

    const { rawTxHex, address, amountWorp } = (await req.json()) as {
      rawTxHex: string;
      address: string;
      amountWorp: number;
    };

    if (!rawTxHex || !address || typeof amountWorp !== "number") {
      return corsJson(
        { error: "rawTxHex, address, amountWorp required" },
        400,
        origin
      );
    }

    /* --------------------------------------------------
     * 1️⃣ Decode tx + compute txid (authoritative)
     * -------------------------------------------------- */
    let tx: bitcoin.Transaction;
    try {
      tx = bitcoin.Transaction.fromHex(rawTxHex);
    } catch {
      return corsJson({ error: "Invalid raw transaction hex" }, 400, origin);
    }

    const txid = tx.getId();

    /* --------------------------------------------------
     * 2️⃣ Verify payment output
     * -------------------------------------------------- */
    const expectedScript = addressToScriptPubKey(address);
    const expectedSats = Math.floor(amountWorp * SATS_PER_WORP);

    if (expectedSats <= 0) {
      return corsJson({ error: "Invalid amount" }, 400, origin);
    }

    let matchedSats = 0;

    for (const out of tx.outs) {
      if (Buffer.from(out.script).equals(expectedScript)) {
        matchedSats += Number(out.value);
      }
    }

    if (matchedSats < expectedSats) {
      return corsJson(
        {
          error: "Address or amount mismatch",
          expected: expectedSats / SATS_PER_WORP,
          found: matchedSats / SATS_PER_WORP,
        },
        400,
        origin
      );
    }

    /* --------------------------------------------------
     * 3️⃣ Broadcast (IDEMPOTENT)
     * -------------------------------------------------- */
    let broadcastTxid: string;

    try {
      broadcastTxid = await sendRawTransaction(rawTxHex);
    } catch (err: any) {
      const msg = String(err?.message ?? "");

      if (
        msg.includes("already in mempool") ||
        msg.includes("already known") ||
        msg.includes("txn-already-known") ||
        msg.includes("txn-already-in-mempool")
      ) {
        broadcastTxid = txid;
      } else {
        throw err;
      }
    }

    /* --------------------------------------------------
     * 4️⃣ Sanity check
     * -------------------------------------------------- */
    if (broadcastTxid !== txid) {
      throw new Error("Broadcast txid mismatch");
    }

    /* --------------------------------------------------
     * 5️⃣ Success
     * -------------------------------------------------- */
    return corsJson(
      {
        success: true,
        txid,
        amount_paid: matchedSats / SATS_PER_WORP,
      },
      200,
      origin
    );
  } catch (err: any) {
    console.error("SEND TX ERROR:", err);

    return corsJson(
      { error: err.message || "Payment failed" },
      500,
      origin
    );
  }
}
