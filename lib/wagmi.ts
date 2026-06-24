"use client";

import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { metaMask } from "wagmi/connectors";

const RPC_URL = "https://evmrpc-testnet.0g.ai";

export const og_galileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    name: "A0GI",
    symbol: "A0GI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: "0G Explorer",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
});

export const config = createConfig({
  chains: [og_galileo],
  connectors: [metaMask()],
  transports: {
    [og_galileo.id]: http(RPC_URL),
  },
  ssr: true,
});
