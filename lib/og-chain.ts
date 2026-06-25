export const CONTRACT_ABI = [
  { inputs: [{ name: "_hash", type: "bytes32" }, { name: "_fragmentId", type: "uint256" }], name: "saveFragment", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "player", type: "address" }, { name: "fragmentId", type: "uint256" }], name: "getFragment", outputs: [{ name: "", type: "bytes32" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "address" }], name: "fragmentCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { anonymous: false, inputs: [{ indexed: true, name: "player", type: "address" }, { indexed: true, name: "hash", type: "bytes32" }, { indexed: false, name: "fragmentId", type: "uint256" }], name: "FragmentSaved", type: "event" },
] as const;

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

export const GALILEO_CHAIN_ID = 16602;

export type ChainErrorType = "WALLET_NOT_CONNECTED" | "WRONG_NETWORK" | "INSUFFICIENT_FUNDS" | "CONTRACT_ERROR" | "UNKNOWN_ERROR";

export interface ChainError { type: ChainErrorType; message: string; userMessage: string }

export function classifyChainError(err: unknown): ChainError {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("User rejected")) return { type: "WALLET_NOT_CONNECTED", message: msg, userMessage: "Transacción rechazada" };
  if (msg.includes("insufficient funds")) return { type: "INSUFFICIENT_FUNDS", message: msg, userMessage: "Fondos insuficientes — faucet.0g.ai" };
  if (msg.includes("chain") || msg.includes("network")) return { type: "WRONG_NETWORK", message: msg, userMessage: "Red incorrecta — cambia a 0G Galileo" };
  if (msg.includes("revert")) return { type: "CONTRACT_ERROR", message: msg, userMessage: "Error en el contrato" };
  return { type: "UNKNOWN_ERROR", message: msg, userMessage: "Error de cadena" };
}

export interface FragmentRecord { fragmentId: number; hash: string; blockNumber: number; timestamp: number }

export async function saveFragmentOnChain(storageHash: string, fragmentId: number): Promise<string> {
  console.log(`[0G Chain] Fragment ${fragmentId} hash ${storageHash}`);
  return storageHash;
}

export async function waitForConfirmation(txHash: string, timeoutMs = 30000): Promise<{ confirmed: boolean; blockNumber?: number }> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const resp = await fetch("https://evmrpc-testnet.0g.ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionReceipt", params: [txHash], id: 1 }),
      });
      const data = await resp.json();
      if (data.result?.blockNumber) return { confirmed: true, blockNumber: parseInt(data.result.blockNumber, 16) };
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return { confirmed: false };
}

export async function isCorrectNetwork(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false;
  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
    return parseInt(chainId, 16) === GALILEO_CHAIN_ID;
  } catch { return false; }
}

export async function switchToGalileo(): Promise<boolean> {
  if (typeof window === "undefined" || !window.ethereum) return false;
  try {
    await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: `0x${GALILEO_CHAIN_ID.toString(16)}` }] });
    return true;
  } catch (e: unknown) {
    if ((e as { code?: number }).code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: `0x${GALILEO_CHAIN_ID.toString(16)}`, chainName: "0G Galileo Testnet", nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 }, rpcUrls: ["https://evmrpc-testnet.0g.ai"], blockExplorerUrls: ["https://chainscan-galileo.0g.ai"] }],
        });
        return true;
      } catch { return false; }
    }
    return false;
  }
}

declare global {
  interface Window { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }
}
