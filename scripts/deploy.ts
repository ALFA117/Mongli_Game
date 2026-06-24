import { createWalletClient, createPublicClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: ".env.local" });

const galileo = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_OG_CHAIN_RPC || "https://evmrpc-testnet.0g.ai"] },
  },
});

async function main() {
  console.log("Deploying MongliMemory to Galileo Testnet...\n");

  const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
  console.log("Deployer:", account.address);

  const publicClient = createPublicClient({ chain: galileo, transport: http() });
  const walletClient = createWalletClient({ account, chain: galileo, transport: http() });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log("Balance:", (Number(balance) / 1e18).toFixed(4), "A0GI\n");

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "MongliMemory.sol", "MongliMemory.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  console.log("Deploying contract (legacy tx)...");

  const gasPrice = await publicClient.getGasPrice();

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    gasPrice,
  });

  console.log("TX hash:", hash);
  console.log("Waiting for confirmation...");

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("\n✅ MongliMemory deployed!");
  console.log("Contract address:", receipt.contractAddress);
  console.log("\nActualiza .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${receipt.contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
