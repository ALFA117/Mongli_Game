"use client";

import { useCallback, useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "./og-chain";

interface ChainWriteResult {
  saveFragment: (storageHash: string, fragmentId: number) => Promise<string | null>;
  isWriting: boolean;
  lastTxHash: string | null;
  error: string | null;
  isConnected: boolean;
  hasContract: boolean;
}

export function useChainWrite(): ChainWriteResult {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [isWriting, setIsWriting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasContract = CONTRACT_ADDRESS !== "0x0000000000000000000000000000000000000000";

  const saveFragment = useCallback(
    async (storageHash: string, fragmentId: number): Promise<string | null> => {
      if (!isConnected) {
        console.warn("[Chain] Wallet not connected — skipping on-chain save");
        return null;
      }

      if (!hasContract) {
        console.warn("[Chain] No contract address configured — skipping on-chain save");
        return null;
      }

      setIsWriting(true);
      setError(null);

      try {
        // Pad hash to bytes32
        let hashBytes: `0x${string}`;
        if (storageHash.startsWith("0x") && storageHash.length === 66) {
          hashBytes = storageHash as `0x${string}`;
        } else {
          const cleaned = storageHash.replace(/^0x/, "").padEnd(64, "0");
          hashBytes = `0x${cleaned}` as `0x${string}`;
        }

        const txHash = await writeContractAsync({
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "saveFragment",
          args: [hashBytes, BigInt(fragmentId)],
        });

        setLastTxHash(txHash);
        console.log(`[Chain] TX submitted: ${txHash}`);
        return txHash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Transaction failed";

        if (msg.includes("User rejected") || msg.includes("user rejected")) {
          setError("Transacción rechazada por el usuario");
        } else if (msg.includes("insufficient funds")) {
          setError("Fondos insuficientes — necesitas A0GI del faucet");
        } else if (msg.includes("chain") || msg.includes("network")) {
          setError("Red incorrecta — cambia a 0G Galileo Testnet");
        } else {
          setError(msg.slice(0, 100));
        }

        console.error("[Chain] Write error:", msg);
        return null;
      } finally {
        setIsWriting(false);
      }
    },
    [isConnected, hasContract, writeContractAsync]
  );

  return { saveFragment, isWriting, lastTxHash, error, isConnected, hasContract };
}
