export interface UnsignedTx {
  inputs: {
    txid: string;
    vout: number;
    amount: number;
    path: {
      chain: 0 | 1;
      index: number;
    };
  }[];
  outputs: {
    address: string;
    amount: number;
  }[];
  fee: number;
}
