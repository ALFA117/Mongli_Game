"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";

interface LeaderboardEntry { walletAddress: string; completionTimeFormatted?: string; toneAverage: number; completedAt: string; shareText?: string }

const MEDALS = ["🥇", "🥈", "🥉"];
const MEDAL_COLORS = ["text-yellow-400", "text-gray-300", "text-amber-600"];

export default function LeaderboardPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gallery?limit=10")
      .then(r => r.json())
      .then(d => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor /><ScanlineOverlay />
      <header className="flex items-center justify-between p-4 border-b border-noir-border/20 relative z-50">
        <button onClick={() => router.push("/")} className="font-display text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent"><GlitchText text="MONGLI" intensity="low" /></button>
        <span className="font-body text-[9px] text-noir-muted">/ leaderboard</span>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-2xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-xl text-noir-accent tracking-wider mb-1">LEADERBOARD</h1>
          <p className="font-body text-xs text-noir-muted">Los más rápidos en despertar</p>
        </div>

        {loading ? (
          <div className="text-center py-16"><motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border border-noir-accent/40 border-t-noir-accent rounded-full mx-auto" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-sm text-noir-muted mb-4">Nadie ha completado un speedrun aún.</p>
            <button onClick={() => router.push("/speedrun")} className="px-6 py-2.5 border-2 border-red-600 text-red-400 font-display text-xs tracking-wider uxpm-press">⚡ Ser el primero</button>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-3 p-3 manila-folder ${i < 3 ? "border-l-2" : ""}`}
                style={i < 3 ? { borderLeftColor: i === 0 ? "#eab308" : i === 1 ? "#9ca3af" : "#b45309" } : undefined}>
                <span className={`text-lg w-8 text-center ${i < 3 ? MEDAL_COLORS[i] : "text-noir-muted/30 text-sm font-mono"}`}>
                  {i < 3 ? MEDALS[i] : `${i + 1}.`}
                </span>
                <div className="flex-1">
                  <p className="font-mono text-[10px] text-noir-muted/50">{e.walletAddress.slice(0, 6)}...{e.walletAddress.slice(-4)}</p>
                  <p className="font-display text-xs text-noir-text">{e.shareText || "—"}</p>
                </div>
                <span className="font-body text-[9px] text-noir-muted/40">{new Date(e.completedAt).toLocaleDateString("es-MX")}</span>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex justify-center gap-3 mt-8">
          <button onClick={() => router.push("/speedrun")} className="px-5 py-2 border border-red-700/50 text-red-400 font-display text-xs uxpm-press">⚡ Speedrun</button>
          <button onClick={() => router.push("/")} className="px-5 py-2 border border-noir-border text-noir-muted font-display text-xs uxpm-press">Inicio</button>
        </div>
      </main>
    </div>
  );
}
