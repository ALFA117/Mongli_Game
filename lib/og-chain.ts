import { ethers } from "ethers";

const CONTRACT_ABI = [
  "function saveFragment(bytes32 _hash, uint256 _fragmentId) external",
  "function getFragment(address player, uint256 fragmentId) external view returns (bytes32)",
  "function fragmentCount(address) external view returns (uint256)",
  "event FragmentSaved(address indexed player, bytes32 indexed hash, uint256 fragmentId)",
];

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!address) throw new Error("Contract address not configured");
  return new ethers.Contract(address, CONTRACT_ABI, signerOrProvider);
}

export async function saveFragmentOnChain(
  signer: ethers.Signer,
  storageHash: string,
  fragmentId: number
): Promise<string> {
  const contract = getContract(signer);
  const hashBytes32 = ethers.zeroPadValue(
    ethers.toBeArray(BigInt(storageHash.slice(0, 66))),
    32
  );
  const tx = await contract.saveFragment(hashBytes32, fragmentId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getFragmentHash(
  provider: ethers.Provider,
  playerAddress: string,
  fragmentId: number
): Promise<string> {
  const contract = getContract(provider);
  return await contract.getFragment(playerAddress, fragmentId);
}

export async function getFragmentCount(
  provider: ethers.Provider,
  playerAddress: string
): Promise<number> {
  const contract = getContract(provider);
  const count = await contract.fragmentCount(playerAddress);
  return Number(count);
}
