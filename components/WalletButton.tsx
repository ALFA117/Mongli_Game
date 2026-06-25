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
                className="px-4 py-2.5 sm:px-6 sm:py-3 border border-noir-accent bg-noir-accent/10 text-noir-accent font-display text-xs sm:text-sm tracking-wider hover:bg-noir-accent/20 transition-colors duration-300 uxpm-press uxpm-tap-highlight uxpm-glow-amber"
              >
                <span className="hidden sm:inline">Conectar Wallet</span>
                <span className="sm:hidden">Wallet</span>
              </motion.button>
            ) : chain?.unsupported ? (
              <motion.button
                onClick={openChainModal}
                whileHover={{ scale: 1.05 }}
                className="px-3 py-2 sm:px-4 sm:py-2 border border-red-800 bg-red-900/20 text-red-400 font-body text-[10px] sm:text-xs uxpm-press uxpm-glow-red"
              >
                Red incorrecta
              </motion.button>
            ) : (
              <motion.button
                onClick={openAccountModal}
                whileHover={{ scale: 1.02 }}
                className="px-3 py-2 sm:px-4 sm:py-2 border border-noir-border bg-noir-card text-noir-text font-body text-[10px] sm:text-xs flex items-center gap-2 uxpm-press uxpm-glass"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                {account.displayName}
              </motion.button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
