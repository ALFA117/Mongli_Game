import { HardhatUserConfig } from "hardhat/config";
import HardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pk = process.env.PRIVATE_KEY;
const hasValidKey = pk && pk.startsWith("0x") && pk.length === 66;

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  plugins: [HardhatToolboxViem],
  networks: {
    galileo: {
      type: "http",
      url: process.env.NEXT_PUBLIC_OG_CHAIN_RPC || "https://evmrpc-testnet.0g.ai",
      chainId: 16600,
      accounts: hasValidKey ? [pk] : [],
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  },
};

export default config;
