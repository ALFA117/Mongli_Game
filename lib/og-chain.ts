export const CONTRACT_ABI = [
  {
    inputs: [
      { name: "_hash", type: "bytes32" },
      { name: "_fragmentId", type: "uint256" },
    ],
    name: "saveFragment",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "player", type: "address" },
      { name: "fragmentId", type: "uint256" },
    ],
    name: "getFragment",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "fragmentCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "player", type: "address" },
      { indexed: true, name: "hash", type: "bytes32" },
      { indexed: false, name: "fragmentId", type: "uint256" },
    ],
    name: "FragmentSaved",
    type: "event",
  },
] as const;

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

// Server-side fallback (used by API route when wallet is not connected)
export async function saveFragmentOnChain(
  storageHash: string,
  fragmentId: number
): Promise<string> {
  console.log(`[0G Chain] Fragment ${fragmentId} hash ${storageHash} — awaiting wallet signature`);
  // Return the storage hash as a placeholder; the real TX happens client-side
  return storageHash;
}
