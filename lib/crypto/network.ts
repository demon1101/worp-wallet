// lib/crypto/networks.ts

import { networks } from "bitcoinjs-lib";

export const worpNetworks = {
  regtest: {
    ...networks.regtest,
    bech32: "rworp",
  },
  testnet: {
    ...networks.testnet,
    bech32: "tworp",
  },
  mainnet: {
    ...networks.bitcoin,
    bech32: "worp",
  },
};
