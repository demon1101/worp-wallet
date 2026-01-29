import { electrumCall } from "@/lib/electrum/client.server";
import * as bitcoin from "bitcoinjs-lib";


export async function fetchElectrumTx(txid: string) {
  const result = await electrumCall(
    "blockchain.transaction.get",
    [txid, false] // force raw hex
  );

  // 🔒 Normalize result
  const hex =
    typeof result === "string"
      ? result
      : typeof result?.hex === "string"
      ? result.hex
      : null;

  if (!hex) {
    throw new Error(`Invalid tx hex from electrum for ${txid}`);
  }

  let tx: bitcoin.Transaction;
  try {
    tx = bitcoin.Transaction.fromHex(hex);
  } catch (err) {
    throw new Error(`Failed to decode tx ${txid}`);
  }

  return {
    txid,
    vin: tx.ins.map(input => ({
      txid: Buffer.from(input.hash).reverse().toString("hex"),
      vout: input.index,
    })),
    vout: tx.outs.map((o, i) => ({
      n: i,
      value: o.value, // bigint
      scriptPubKey: {
        hex: Buffer.from(o.script).toString("hex"),
      },
    })),
  };
}
