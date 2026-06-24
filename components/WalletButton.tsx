"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="border border-[#c4923a]/30 text-[#e8d5b0]/70 px-4 py-2 font-mono text-xs
          hover:border-[#c4923a]/60 transition-all cursor-pointer"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        const metamask = connectors.find((c) => c.id === "metaMaskSDK") || connectors[0];
        if (metamask) connect({ connector: metamask });
      }}
      className="wallet-btn border border-red-900/60 text-[#e8d5b0] px-8 py-4 font-mono text-sm
        uppercase tracking-widest cursor-pointer relative overflow-hidden
        transition-all duration-300 hover:border-red-700 hover:shadow-[0_0_30px_rgba(180,0,0,0.3)]"
    >
      <span className="relative z-10">Conectar Wallet</span>
      <div className="absolute inset-0 bg-red-900/10 animate-pulse" />
    </button>
  );
}
