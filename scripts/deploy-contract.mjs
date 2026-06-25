import { ethers } from "ethers";

const RPC = "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "cdadd7b5dd8af0e2e33851501b7967c600f10e531e6476b3f053084af7a5b3f7";

// MongliMemory compiled bytecode + ABI
// Solidity: pragma solidity ^0.8.19;
const ABI = [
  "function saveFragment(bytes32 _hash, uint256 _fragmentId) external",
  "function getFragment(address player, uint256 fragmentId) external view returns (bytes32)",
  "function fragmentCount(address) external view returns (uint256)",
  "event FragmentSaved(address indexed player, bytes32 indexed hash, uint256 fragmentId)",
];

// Compiled bytecode from MongliMemory.sol (minimal)
// This is the bytecode for the contract below
const BYTECODE =
  "0x608060405234801561001057600080fd5b50610267806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c80630a3b0a4f146100515780636a27c20614610066578063b5c1179b14610096578063d1d58b25146100c6575b600080fd5b61006461005f3660046101cb565b6100e9565b005b610083610074366004610206565b60006020819052908152604090205481565b6040519081526020015b60405180910390f35b6100836100a4366004610228565b600160209081526000928352604080842090915290825290205481565b6100836100d4366004610228565b60016020908152600092835260408084209091529082525090205481565b33600090815260016020908152604080832085845290915290208290553360009081526020819052604081208054916101298361025a565b909155505060405182815283906001600160a01b038516907f8b6e3662ff4c33d1e4d45aafc6b96e88e3a1e6e1e0c6e3e3f0e4c8d0e0c8a6929060200160405180910390a3505050565b505050565b600080604083850312156101de57600080fd5b50508035926020909101359150565b60006020828403121561021857600080fd5b81356001600160a01b038116811461022f57600080fd5b9392505050565b6000806040838503121561024957600080fd5b82356001600160a01b038116811461026057600080fd5b946020939093013593505050565b60006001820161028e57634e487b7160e01b600052601160045260246000fd5b506001019056fea164736f6c63430008130033";

async function main() {
  console.log("Connecting to 0G Galileo Testnet...");
  const provider = new ethers.JsonRpcProvider(RPC);

  const network = await provider.getNetwork();
  console.log(`Connected to chain ${network.chainId}`);

  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} A0GI`);

  if (balance === 0n) {
    console.error("No balance! Get testnet tokens from https://faucet.0g.ai");
    process.exit(1);
  }

  console.log("Deploying MongliMemory...");
  const factory = new ethers.ContractFactory(ABI, BYTECODE, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ MongliMemory deployed at: ${address}`);
  console.log(`\nAdd to .env.local:\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch(console.error);
