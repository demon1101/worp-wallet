import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";

import {
  mnemonicToRoot,
  deriveAccountNode,
  deriveReceiveNode,
  deriveChangeNode,
} from "@/lib/crypto/hd";

import { worpNetworks } from "@/lib/crypto/network";
import { UnsignedTx } from "./types";

bitcoin.initEccLib(ecc);

export function signTx(
  mnemonic: string,
  unsignedTx: UnsignedTx
): string {
  const network =
    (process.env.NEXT_PUBLIC_WORP_NETWORK as
      | "regtest"
      | "testnet"
      | "mainnet") ?? "regtest";

  const net = worpNetworks[network];

  // 1️⃣ Rebuild HD tree
  const root = mnemonicToRoot(mnemonic);
  const account = deriveAccountNode(root);
  const receive = deriveReceiveNode(account);
  const change = deriveChangeNode(account);

  // 2️⃣ Create PSBT
  const psbt = new bitcoin.Psbt({ network: net });

  // 3️⃣ Inputs
  for (const input of unsignedTx.inputs) {
    const node =
      input.path.chain === 0
        ? receive.derive(input.path.index)
        : change.derive(input.path.index);

    const payment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(node.publicKey),
      network: net,
    });

    psbt.addInput({
      hash: input.txid,
      index: input.vout,
      witnessUtxo: {
        script: payment.output!,
        value: BigInt(input.amount), // ✅ REMAIN number
      },
    });
  }

  // 4️⃣ Outputs
  for (const out of unsignedTx.outputs) {
    psbt.addOutput({
      address: out.address,
      value: BigInt(out.amount), // ✅ REMAIN number
    });
  }

  // 5️⃣ Sign
  unsignedTx.inputs.forEach((input, i) => {
    const node =
      input.path.chain === 0
        ? receive.derive(input.path.index)
        : change.derive(input.path.index);

    psbt.signInput(i, {
      publicKey: Buffer.from(node.publicKey),
      sign: (hash: Buffer) =>
        Buffer.from(ecc.sign(hash, node.privateKey!)),
    });
  });

  // 6️⃣ Finalize
  psbt.finalizeAllInputs();

  return psbt.extractTransaction().toHex();
}
