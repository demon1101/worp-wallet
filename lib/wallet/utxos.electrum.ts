// lib/wallet/utxos.electrum.ts

import { HDKey } from "@scure/bip32";
import {
  electrumCall,
  electrumCallBatch,
} from "@/lib/electrum/client.server";
import { pubkeyToWorpAddress } from "@/lib/crypto/address";
import { addressToScripthash } from "@/lib/electrum/scripthash";

export type WalletUtxo = {
  txid: string;
  vout: number;
  value: number;
  confirmations: number;
  address: string;
  path: {
    chain: 0 | 1;
    index: number;
  };
};

const GAP_LIMIT = 20;

export async function fetchElectrumUtxosByXpub(
  xpub: string
): Promise<WalletUtxo[]> {
  const account = HDKey.fromExtendedKey(xpub);

  const receive = account.derive("m/0");
  const change = account.derive("m/1");

  const header = await electrumCall(
    "blockchain.headers.subscribe"
  );
  const chainHeight: number = header.height;

  const utxos: WalletUtxo[] = [];

  async function scanChain(
    node: HDKey,
    chain: 0 | 1
  ) {
    const derived = [];

    for (let i = 0; i < GAP_LIMIT; i++) {
      const child = node.derive(`m/${i}`);
      const address = pubkeyToWorpAddress(
        Buffer.from(child.publicKey!)
      );
      const scripthash = addressToScripthash(address);

      derived.push({ address, scripthash, index: i });
    }

    const results = await electrumCallBatch<any[]>(
      derived.map(d => ({
        method: "blockchain.scripthash.listunspent",
        params: [d.scripthash],
      }))
    );

    for (let i = 0; i < results.length; i++) {
      const list = results[i];
      const meta = derived[i];

      for (const u of list) {
        utxos.push({
          txid: u.tx_hash,
          vout: u.tx_pos,
          value: u.value,
          confirmations:
            u.height > 0
              ? chainHeight - u.height + 1
              : 0,
          address: meta.address,
          path: {
            chain,
            index: meta.index,
          },
        });
      }
    }
  }

  await scanChain(receive, 0);
  await scanChain(change, 1);

  return utxos;
}
