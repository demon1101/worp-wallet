export type ElectrumHistoryEntry = {
  tx_hash: string;
  height: number;
};

export type ElectrumBalance = {
  confirmed: number;
  unconfirmed: number;
};
