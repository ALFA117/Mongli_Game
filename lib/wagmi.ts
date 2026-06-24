import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const og_galileo = defineChain({
  id: 16600,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    name: "A0GI",
    symbol: "A0GI",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_OG_CHAIN_RPC ||
          "https://evmrpc-testnet.0g.ai",
      ],
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

export const config = getDefaultConfig({
  appName: "Mongli Game",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || "mongli-game-dev",
  chains: [og_galileo],
  ssr: true,
});
