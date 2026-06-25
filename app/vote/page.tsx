"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";
import Providers from "@/components/Providers";
import { useAccount } from "wagmi";
import type { VoteCandidate } from "@/lib/types";

function VoteContent() {
  const router = useRouter();
  const { address } = useAccount();
  const [candidates, setCandidates] = useState<VoteCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/vote").then(r => r.json()).then(d => { setCandidates(d.candidates || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleVote = async (candidateId: string) => {
    if (!address || votedIds.has(candidateId)) return;
    await fetch("/api/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "vote", voterWallet: address, candidateId }) });
    setVotedIds(prev => new Set([...prev, candidateId]));
    setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, votes: c.votes + 1 } : c));
  };

  const maxVotes = Math.max(...candidates.map(c => c.votes), 1);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor /><ScanlineOverlay />
      <header className="flex items-center justify-between p-4 border-b border-noir-border/20 relative z-50">
        <button onClick={() => router.push("/")} className="font-display text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent"><GlitchText text="MONGLI" intensity="low" /></button>
        <span className="font-body text-[9px] text-noir-muted">/ votación</span>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-xl text-noir-accent tracking-wider mb-1">FRAGMENTO DE LA SEMANA</h1>
          <p className="font-body text-xs text-noir-muted">Vota el recuerdo más perturbador</p>
        </div>

        {loading ? (
          <div className="text-center py-16"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border border-noir-accent/40 border-t-noir-accent rounded-full mx-auto" /></div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-sm text-noir-muted mb-4">Aún no hay nominaciones esta semana.</p>
            <button onClick={() => router.push("/game")} className="px-6 py-2.5 border-2 border-noir-accent text-noir-accent font-display text-xs uxpm-press">Juega y nomina tu mejor fragmento</button>
          </div>
        ) : (
          <div className="space-y-3">
            {candidates.map((c, i) => {
              const voted = votedIds.has(c.id) || (address && c.voterWallets.includes(address.toLowerCase()));
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="manila-folder p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-display text-xs text-noir-text leading-relaxed mb-2">
                        &ldquo;{c.fragmentText.slice(0, 120)}{c.fragmentText.length > 120 ? "..." : ""}&rdquo;
                      </p>
                      <p className="font-mono text-[8px] text-noir-muted/40">
                        {c.walletAddress.slice(0, 6)}...{c.walletAddress.slice(-4)} · Acto {c.actNumber}
                      </p>
                    </div>
                    <button onClick={() => handleVote(c.id)} disabled={!address || !!voted}
                      className={`shrink-0 px-3 py-2 border font-display text-xs uxpm-press ${voted ? "border-green-800/40 text-green-500/60 cursor-default" : "border-noir-accent/50 text-noir-accent hover:bg-noir-accent/10"}`}>
                      {voted ? "✓" : "▲"} {c.votes}
                    </button>
                  </div>
                  {/* Vote bar */}
                  <div className="h-[2px] bg-noir-border/20 mt-2"><div className="h-full bg-noir-accent/40 transition-all" style={{ width: `${(c.votes / maxVotes) * 100}%` }} /></div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function VotePage() { return <Providers><VoteContent /></Providers>; }
