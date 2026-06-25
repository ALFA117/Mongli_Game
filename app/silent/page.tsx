"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import { initAudio, playChoice, startAudioOnFirstInteraction } from "@/lib/audio";
import { generateFragmentVisual } from "@/lib/fragment-visual";
import { ACTS } from "@/lib/types";
import type { Fragment } from "@/lib/types";
import { useAccount } from "wagmi";

const SYMBOLS = ["◈", "◐", "◑", "▓", "░", "▼", "⬡", "∞", "⊕", "◌", "●", "○", "▲", "◆", "✦", "⊗"];

function seeded(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function getSymbols(fragId: number, actNum: number): string[] {
  const rng = seeded(fragId * 7919 + actNum * 31);
  const count = 3 + Math.floor(rng() * 3);
  return Array.from({ length: count }, () => SYMBOLS[Math.floor(rng() * SYMBOLS.length)]);
}

function getToneBar(tone: number): string {
  if (tone <= 3) return "░░░░░░░░░░";
  if (tone <= 6) return "▓░▓░▓░▓░▓░";
  return "▓▓▓▓▓▓▓▓▓▓";
}

function SilentContent() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [actIdx, setActIdx] = useState(0);
  const [fragIdx, setFragIdx] = useState(0);
  const [phase, setPhase] = useState<"visual" | "decision" | "end">("visual");
  const [allFrags, setAllFrags] = useState<Fragment[]>([]);
  const autoRef = useRef<ReturnType<typeof setTimeout>>();
  const TOTAL_ACTS = 5;
  const act = ACTS[Math.min(actIdx, 4)];

  useEffect(() => {
    initAudio();
    const s = () => startAudioOnFirstInteraction();
    document.addEventListener("click", s, { once: true });
    return () => document.removeEventListener("click", s);
  }, []);

  useEffect(() => { if (!isConnected) router.push("/"); }, [isConnected, router]);

  // Generate silent fragments (just use IDs for visuals, no API call needed)
  const currentFrag: Fragment = {
    id: actIdx * 3 + fragIdx + 1,
    text: "", toneScore: 3 + Math.floor(Math.random() * 7),
    tags: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, i) => `t${i}`),
    traces: [], choiceMade: "", timestamp: Date.now(), unlocked: true,
  };

  const visual = generateFragmentVisual(currentFrag);
  const symbols = getSymbols(currentFrag.id, actIdx);

  // Auto-advance fragments
  useEffect(() => {
    if (phase !== "visual") return;
    autoRef.current = setTimeout(() => {
      if (fragIdx < 2) {
        setFragIdx(p => p + 1);
      } else {
        if (actIdx >= TOTAL_ACTS - 1) setPhase("end");
        else setPhase("decision");
      }
    }, 5000);
    return () => { if (autoRef.current) clearTimeout(autoRef.current); };
  }, [fragIdx, phase, actIdx]);

  const handleDecision = useCallback((tone: "dark" | "light") => {
    playChoice();
    setAllFrags(p => [...p, { ...currentFrag, choiceMade: tone }]);
    setActIdx(p => p + 1);
    setFragIdx(0);
    setPhase("visual");
  }, [currentFrag]);

  // Determine identity from choices
  const darkCount = allFrags.filter(f => f.choiceMade === "dark").length;
  const total = allFrags.length;
  const identity = total === 0 ? "◐" : darkCount > total / 2 ? "▓" : darkCount < total / 2 ? "░" : "◐";

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <Cursor /><ScanlineOverlay />

      <header className="flex items-center justify-between p-3 border-b border-noir-border/10 relative z-50">
        <span className="font-mono text-[9px] text-noir-muted/30">◌ silencio</span>
        <span className="font-mono text-[9px] text-noir-muted/20">{actIdx + 1}/{TOTAL_ACTS}</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {phase === "visual" && (
            <motion.div key={`v-${actIdx}-${fragIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1 }} className="flex flex-col items-center gap-8">
              {/* Visual */}
              <div className="w-[300px] sm:w-[400px] h-[180px] sm:h-[240px]" dangerouslySetInnerHTML={{ __html: visual.svgContent.replace('viewBox="0 0 200 120"', 'viewBox="0 0 200 120" width="100%" height="100%"') }} />

              {/* Symbols */}
              <div className="flex items-center gap-4">
                {symbols.map((s, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.3 }}
                    className="text-2xl sm:text-3xl" style={{ color: visual.primaryColor }}>{s}</motion.span>
                ))}
              </div>

              {/* Tone bar */}
              <p className="font-mono text-xs tracking-[0.3em]" style={{ color: visual.primaryColor, opacity: 0.4 }}>
                {getToneBar(currentFrag.toneScore)}
              </p>
            </motion.div>
          )}

          {phase === "decision" && (
            <motion.div key="dec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center gap-16">
              <motion.button onClick={() => handleDecision("light")} whileHover={{ scale: 1.2 }}
                className="text-6xl text-noir-accent/60 hover:text-noir-accent transition-colors uxpm-press">○</motion.button>
              <motion.button onClick={() => handleDecision("dark")} whileHover={{ scale: 1.2 }}
                className="text-6xl text-noir-text/60 hover:text-noir-text transition-colors uxpm-press">●</motion.button>
            </motion.div>
          )}

          {phase === "end" && (
            <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
                className="text-[128px] block mb-8" style={{ color: identity === "▓" ? "#b42828" : identity === "░" ? "#c4923a" : "#7c3aed" }}>
                {identity}
              </motion.span>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} transition={{ delay: 2 }}
                className="font-mono text-[9px] text-noir-muted tracking-wider mb-8">
                {allFrags.length} decisiones · silencio
              </motion.p>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}>
                <button onClick={() => router.push("/")} className="font-mono text-[10px] text-noir-muted/30 hover:text-noir-accent transition-colors">
                  salir
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Minimal progress */}
      <div className="h-[1px] bg-noir-border/5"><div className="h-full bg-noir-accent/20 transition-all" style={{ width: `${((actIdx * 3 + fragIdx) / (TOTAL_ACTS * 3)) * 100}%` }} /></div>
    </div>
  );
}

export default function SilentPage() {
  return <Providers><Suspense fallback={<div className="min-h-screen bg-black" />}><SilentContent /></Suspense></Providers>;
}
