import { WalletUtxo } from "@/lib/wallet/utxos.electrum";
import { UnsignedTx } from "./types";

const DEFAULT_FEE_RATE = 1; // sat/vbyte 
const DUST_LIMIT = 300;

// P2WPKH size constants
const INPUT_VBYTES = 68;
const OUTPUT_VBYTES = 31;
const BASE_VBYTES = 10;

/**
 * Build unsigned WORP transaction (Electrum-compatible)
 * Semantics:
 * - `amount` is EXACT amount sent to receiver
 * - fee is ADDITIONAL
 */
export function buildUnsignedTx(params: {
  utxos: WalletUtxo[];
  toAddress: string;
  amount: number; // sats (EXACT to receiver)
  changeAddress: string;
  feeRate?: number; // sat/vbyte
}): UnsignedTx {
  const { utxos, toAddress, amount, changeAddress } = params;
  const feeRate = params.feeRate ?? DEFAULT_FEE_RATE;

  if (amount <= 0) {
    throw new Error("Invalid amount");
  }

  let totalIn = 0;
  let fee = 0;
  const selected: WalletUtxo[] = [];

  /* --------------------------------------------------
   * 1️⃣ Fee-aware UTXO selection
   * -------------------------------------------------- */
  for (const utxo of utxos) {
    selected.push(utxo);
    totalIn += utxo.value;

    const vbytes =
      BASE_VBYTES +
      selected.length * INPUT_VBYTES +
      2 * OUTPUT_VBYTES; // to + change (assume change)

    fee = Math.ceil(vbytes * feeRate);

    if (totalIn >= amount + fee) break;
  }

  if (totalIn < amount + fee) {
    throw new Error("Insufficient funds for amount + fee");
  }

  /* --------------------------------------------------
   * 2️⃣ Outputs
   * -------------------------------------------------- */
  const outputs = [
    {
      address: toAddress,
      amount: amount, // EXACT receiver amount
    },
  ];

  let change = totalIn - amount - fee;

  // If change is dust, drop change output → fee increases implicitly
  if (change >= DUST_LIMIT) {
    outputs.push({
      address: changeAddress,
      amount: change,
    });
  } else {
    fee += change; // dust added to fee
    change = 0;
  }

  /* --------------------------------------------------
   * 3️⃣ Inputs (SIGNER-READY, SegWit)
   * -------------------------------------------------- */
  const inputs = selected.map(u => ({
    txid: u.txid,
    vout: u.vout,
    amount: u.value, // REQUIRED for SegWit sighash
    path: u.path,
  }));

  return {
    inputs,
    outputs,
    fee,
  };
}
