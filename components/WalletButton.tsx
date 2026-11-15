"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { IconWallet, IconAlert } from "./Icons";

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
              <button onClick={openConnectModal} className="btn btn-secondary !min-h-[44px] !px-4 !text-[14px]">
                <IconWallet size={16} />
                <span className="hidden sm:inline">Conectar wallet</span>
                <span className="sm:hidden">Conectar</span>
              </button>
            ) : chain?.unsupported ? (
              <button onClick={openChainModal}
                className="btn !min-h-[44px] !px-4 !text-[14px] border-noir-accent text-noir-accent bg-transparent">
                <IconAlert size={16} /> Red incorrecta
              </button>
            ) : (
              <button onClick={openAccountModal}
                className="btn btn-secondary !min-h-[44px] !px-3 !text-[13px] !font-medium font-mono">
                <span className="w-2 h-2 rounded-full bg-noir-ok shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[110px] sm:max-w-[140px] font-mono">{account.displayName}</span>
                <span className="text-noir-muted text-xs hidden sm:inline font-mono">{chain.name?.split(" ")[0]}</span>
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
