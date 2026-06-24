"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className="border border-[#c4923a]/50 text-[#e8d5b0] px-6 py-3 font-mono text-sm
                  hover:bg-[#c4923a]/10 hover:border-[#c4923a] transition-all uppercase tracking-widest"
              >
                Conectar Wallet
              </button>
            ) : chain.unsupported ? (
              <button
                onClick={openChainModal}
                className="border border-red-700/50 text-red-400 px-6 py-3 font-mono text-sm
                  hover:bg-red-900/20 transition-all"
              >
                Red incorrecta
              </button>
            ) : (
              <button
                onClick={openAccountModal}
                className="border border-[#c4923a]/30 text-[#e8d5b0]/70 px-4 py-2 font-mono text-xs
                  hover:border-[#c4923a]/60 transition-all"
              >
                {account.displayName}
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
