"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";

export default function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;

        return (
          <div
            {...(!mounted && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none" as const, userSelect: "none" as const },
            })}
          >
            {!connected ? (
              <motion.button
                onClick={openConnectModal}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow: [
                    "0 0 8px rgba(196,146,58,0.3)",
                    "0 0 20px rgba(196,146,58,0.5)",
                    "0 0 8px rgba(196,146,58,0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-5 py-2.5 sm:px-7 sm:py-3 border-2 border-noir-accent bg-noir-accent/15 text-noir-accent font-display text-xs sm:text-sm tracking-[0.15em] hover:bg-noir-accent/25 transition-colors duration-300 uxpm-press uxpm-tap-highlight relative overflow-hidden"
              >
                {/* MetaMask fox icon hint */}
                <span className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-70">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M16 7V5a4 4 0 0 0-8 0v2" />
                  </svg>
                  <span className="hidden sm:inline">Conectar MetaMask</span>
                  <span className="sm:hidden">Conectar</span>
                </span>
              </motion.button>
            ) : chain?.unsupported ? (
              <motion.button
                onClick={openChainModal}
                whileHover={{ scale: 1.05 }}
                animate={{
                  boxShadow: [
                    "0 0 5px rgba(220,50,50,0.3)",
                    "0 0 15px rgba(220,50,50,0.5)",
                    "0 0 5px rgba(220,50,50,0.3)",
                  ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="px-4 py-2 sm:px-5 sm:py-2.5 border-2 border-red-700 bg-red-900/20 text-red-400 font-display text-[10px] sm:text-xs tracking-wider uxpm-press"
              >
                ⚠ Red incorrecta
              </motion.button>
            ) : (
              <motion.button
                onClick={openAccountModal}
                whileHover={{ scale: 1.02 }}
                className="px-3 py-2 sm:px-4 sm:py-2.5 border border-noir-accent/40 bg-noir-card text-noir-text font-body text-[10px] sm:text-xs flex items-center gap-2 uxpm-press uxpm-glass"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{account.displayName}</span>
                <span className="text-noir-muted/40 text-[8px] hidden sm:inline">
                  {chain.name?.split(" ")[0]}
                </span>
              </motion.button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
