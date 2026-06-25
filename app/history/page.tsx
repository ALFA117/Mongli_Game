"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import GlitchText from "@/components/GlitchText";
import { useAccount } from "wagmi";
import { ACTS } from "@/lib/types";

interface HistoryData {
  wallet: string;
  acts: Array<{
    id: number;
    text: string;
    toneScore: number;
    tags: string[];
    choiceMade: string;
    storageHash?: string;
    txHash?: string;
    timestamp: number;
  }>;
  totalFragments: number;
}

function HistoryContent() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    fetch(`/api/history?wallet=${address}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  const actsPlayed = data?.acts?.length || 0;

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor />
      <ScanlineOverlay />

      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-noir-border/20 relative z-50">
        <div className="flex items-center gap-3">
          <motion.button onClick={() => router.push("/")} whileHover={{ scale: 1.05 }}
            className="font-display text-base sm:text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent transition-colors">
            <GlitchText text="MONGLI" intensity="low" />
          </motion.button>
          <span className="font-body text-[10px] text-noir-muted tracking-wider">/ expediente</span>
        </div>
        <WalletButton />
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-2xl mx-auto w-full">
        {/* Title */}
        <div className="mb-8">
          <p className="text-[8px] font-body text-noir-muted/40 uppercase tracking-[0.4em] mb-1">
            Archivo clasificado
          </p>
          <h1 className="font-display text-xl sm:text-2xl text-noir-accent tracking-wider">
            Mi Expediente
          </h1>
          {address && (
            <p className="font-mono text-[9px] text-noir-muted/40 mt-1">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
          <div className="h-[1px] bg-gradient-to-r from-noir-accent/30 to-transparent mt-3" />
        </div>

        {!isConnected ? (
          <div className="text-center py-16">
            <p className="font-display text-sm text-noir-muted mb-4">Conecta tu wallet para ver tu expediente</p>
            <WalletButton />
          </div>
        ) : loading ? (
          <div className="text-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border border-noir-accent/40 border-t-noir-accent rounded-full mx-auto mb-4" />
            <p className="font-display text-xs text-noir-muted">Recuperando expediente...</p>
          </div>
        ) : (
          <>
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="manila-folder p-3 text-center">
                <p className="font-display text-xl text-noir-text">{actsPlayed}</p>
                <p className="text-[8px] font-body text-noir-muted uppercase">actos</p>
              </div>
              <div className="manila-folder p-3 text-center">
                <p className="font-display text-xl text-noir-text">{data?.totalFragments || 0}</p>
                <p className="text-[8px] font-body text-noir-muted uppercase">fragmentos</p>
              </div>
              <div className="manila-folder p-3 text-center">
                <p className="font-display text-xl text-noir-text">{5 - actsPlayed}</p>
                <p className="text-[8px] font-body text-noir-muted uppercase">pendientes</p>
              </div>
            </div>

            {/* Act cards */}
            <div className="space-y-4">
              {ACTS.map((actDef, i) => {
                const actData = data?.acts?.find((a) => a.id === actDef.id);
                const played = !!actData;

                return (
                  <motion.div
                    key={actDef.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`manila-folder p-4 sm:p-5 relative ${!played ? "opacity-40" : ""}`}
                  >
                    {/* Act number */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm text-noir-accent">
                          Acto {actDef.id}
                        </span>
                        <span className="font-body text-[10px] text-noir-muted">
                          {actDef.title}
                        </span>
                      </div>
                      {played ? (
                        <span className="text-[8px] font-body text-green-500 border border-green-800/40 px-1.5 py-0.5">
                          completado
                        </span>
                      ) : (
                        <span className="text-[8px] font-body text-noir-muted border border-noir-border/30 px-1.5 py-0.5">
                          pendiente
                        </span>
                      )}
                    </div>

                    {played && actData ? (
                      <div className="space-y-2">
                        {/* Fragment text preview */}
                        <p className="font-display text-xs text-noir-text/70 leading-relaxed line-clamp-3">
                          {actData.text}
                        </p>

                        {/* Decision */}
                        {actData.choiceMade && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-body text-noir-muted">Decisión:</span>
                            <span className="text-[9px] font-display text-noir-accent/80 truncate">
                              {actData.choiceMade}
                            </span>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-[8px] font-body text-noir-muted/40 pt-2 border-t border-noir-border/20">
                          <span>{new Date(actData.timestamp).toLocaleDateString("es-MX")}</span>
                          {actData.txHash && (
                            <a
                              href={`https://chainscan-galileo.0g.ai/tx/${actData.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-500/60 hover:text-green-400 underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              TX: {actData.txHash.slice(0, 10)}...
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="font-body text-[10px] text-noir-muted/30 italic">
                        {actDef.subtitle}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {actsPlayed < 5 && (
                <motion.button
                  onClick={() => router.push("/game")}
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-2.5 border-2 border-noir-accent text-noir-accent font-display text-xs tracking-wider hover:bg-noir-accent/10 uxpm-press"
                >
                  {actsPlayed > 0 ? "Continuar partida" : "Nueva partida"}
                </motion.button>
              )}
              {actsPlayed > 0 && address && (
                <motion.button
                  onClick={() => router.push(`/replay?wallet=${address}`)}
                  whileHover={{ scale: 1.05 }}
                  className="px-6 py-2.5 border border-noir-accent/50 text-noir-accent font-display text-xs tracking-wider hover:bg-noir-accent/10 uxpm-press">
                  ▶ Reproducir mi historia
                </motion.button>
              )}
              <motion.button
                onClick={() => router.push("/")}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2.5 border border-noir-border text-noir-muted font-display text-xs tracking-wider hover:text-noir-accent uxpm-press"
              >
                Volver
              </motion.button>
            </div>
          </>
        )}

        {/* Footer stamp */}
        <div className="text-center mt-12">
          <p className="text-[7px] font-body text-noir-muted/20 tracking-[0.2em]">
            ARCHIVO PERMANENTE — 0G STORAGE — MONGLI GAME
          </p>
        </div>
      </main>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Providers>
      <HistoryContent />
    </Providers>
  );
}
