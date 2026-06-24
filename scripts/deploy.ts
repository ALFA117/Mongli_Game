import hre from "hardhat";
import { formatEther } from "viem";

async function main() {
  console.log("Deploying MongliMemory to Galileo Testnet...");

  const [deployer] = await hre.network.provider.request({
    method: "eth_accounts",
  }) as string[];
  console.log("Deployer:", deployer);

  const balance = await hre.network.provider.request({
    method: "eth_getBalance",
    params: [deployer, "latest"],
  }) as string;
  console.log("Balance:", formatEther(BigInt(balance)), "A0GI");

  const contract = await hre.viem.deployContract("MongliMemory");
  console.log("MongliMemory deployed to:", contract.address);
  console.log("\nActualiza .env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contract.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
