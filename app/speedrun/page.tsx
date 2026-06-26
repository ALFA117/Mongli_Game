"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import Toast from "@/components/Toast";
import GlitchText from "@/components/GlitchText";
import FragmentComponent from "@/components/Fragment";
import { initAudio, playChoice, playChainConfirm, startAudioOnFirstInteraction } from "@/lib/audio";
import { useChainWrite } from "@/lib/useChainWrite";
import { ACTS } from "@/lib/types";
import type { Fragment, GenerateResponse } from "@/lib/types";
import { useAccount } from "wagmi";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

function formatTime(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  const millis = Math.floor((ms % 1000));
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(millis).padStart(3, "0")}`;
}

function SpeedrunContent() {
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const chainWrite = useChainWrite();

  const [actIdx, setActIdx] = useState(0);
  const [phase, setPhase] = useState<"countdown" | "fragments" | "decision" | "result">("countdown");
  const [actFragments, setActFragments] = useState<Fragment[]>([]);
  const [fragIdx, setFragIdx] = useState(0);
  const [allFragments, setAllFragments] = useState<Fragment[]>([]);
  const [fragmentDone, setFragmentDone] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [decisionCountdown, setDecisionCountdown] = useState(10);
  const [toast, setToast] = useState<{ message: string; hash?: string; visible: boolean }>({ message: "", visible: false });
  const [saved, setSaved] = useState(false);

  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const decisionTimerRef = useRef<ReturnType<typeof setInterval>>();
  const autoAdvRef = useRef<ReturnType<typeof setTimeout>>();

  const act = ACTS[actIdx];

  useEffect(() => {
    initAudio();
    const s = () => startAudioOnFirstInteraction();
    document.addEventListener("click", s, { once: true });
    return () => document.removeEventListener("click", s);
  }, []);

  useEffect(() => {
    // Guest mode allowed — no wallet redirect
  }, [isConnected, router]);

  // 3-2-1 countdown then start
  useEffect(() => {
    if (phase !== "countdown") return;
    const t = setTimeout(() => {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setElapsedMs(Date.now() - startTimeRef.current), 47);
      startActFragments();
    }, 2000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startActFragments = useCallback(async () => {
    setPhase("fragments");
    setActFragments([]);
    setFragIdx(0);
    setFragmentDone(false);

    const frags: Fragment[] = [];
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: ACTS[actIdx].sceneDescription + " IMPORTANTE: máximo 60 palabras.", history: allFragments, choice: "", fragmentId: allFragments.length + i + 1 }),
        });
        const data = await r.json() as GenerateResponse;
        frags.push(data.fragment);
        setActFragments([...frags]);
      } catch {
        frags.push({ id: allFragments.length + i + 1, text: "La memoria parpadea...", toneScore: 5, tags: [], traces: [], choiceMade: "", timestamp: Date.now(), unlocked: true });
        setActFragments([...frags]);
      }
    }
  }, [actIdx, allFragments]);

  const handleFragDone = useCallback(() => {
    setFragmentDone(true);
    autoAdvRef.current = setTimeout(() => {
      if (fragIdx < 2) { setFragIdx((p) => p + 1); setFragmentDone(false); }
      else { setPhase("decision"); setDecisionCountdown(10); }
    }, 1000);
  }, [fragIdx]);

  // Auto-advance fragments after 3s
  useEffect(() => {
    if (phase !== "fragments" || !actFragments[fragIdx]) return;
    const t = setTimeout(() => handleFragDone(), 3000);
    return () => clearTimeout(t);
  }, [phase, fragIdx, actFragments, handleFragDone]);

  // Decision countdown
  useEffect(() => {
    if (phase !== "decision") return;
    decisionTimerRef.current = setInterval(() => {
      setDecisionCountdown((p) => {
        if (p <= 1) { handleDecision(act.decision.dark.text); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => { if (decisionTimerRef.current) clearInterval(decisionTimerRef.current); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDecision = useCallback((text: string) => {
    if (decisionTimerRef.current) clearInterval(decisionTimerRef.current);
    playChoice();
    setAllFragments((p) => [...p, ...actFragments]);
    if (actIdx < 4) {
      setActIdx((p) => p + 1);
      setTimeout(() => startActFragments(), 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedMs(Date.now() - startTimeRef.current);
      setPhase("result");
    }
  }, [actFragments, actIdx, startActFragments]);

  const handleSave = useCallback(async () => {
    if (!address || saved) return;
    const record = {
      walletAddress: address,
      completionTimeMs: elapsedMs,
      completionTimeFormatted: formatTime(elapsedMs),
      identity: "speedrunner",
      toneAverage: allFragments.length > 0 ? allFragments.reduce((s, f) => s + f.toneScore, 0) / allFragments.length : 5,
      completedAt: new Date().toISOString(),
    };

    // Sign once with MetaMask
    if (chainWrite.isConnected && chainWrite.hasContract) {
      const hash = `0x${Date.now().toString(16).padEnd(64, "0")}`;
      await chainWrite.saveFragment(hash, 999);
    }

    await fetch("/api/gallery", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...record, darkDecisions: 0, lightDecisions: 0, totalDecisions: 5, shareText: `Speedrun: ${record.completionTimeFormatted}` }) });
    playChainConfirm();
    setSaved(true);
    setToast({ message: "Récord guardado en 0G", visible: true });
  }, [address, saved, elapsedMs, allFragments, chainWrite]);

  const best = typeof window !== "undefined" ? localStorage.getItem("mongli-speedrun-best") : null;
  const isNewRecord = phase === "result" && (!best || elapsedMs < parseInt(best, 10));
  useEffect(() => {
    if (isNewRecord && typeof window !== "undefined") localStorage.setItem("mongli-speedrun-best", String(elapsedMs));
  }, [isNewRecord, elapsedMs]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor /><ScanlineOverlay />

      <header className="flex items-center justify-between p-3 border-b border-noir-border/20 relative z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="font-display text-base text-noir-text tracking-[0.15em] hover:text-noir-accent">
            <GlitchText text="MONGLI" intensity="low" />
          </button>
          <span className="text-[9px] font-body text-red-400 border border-red-800/40 px-1.5 py-0.5">⚡ SPEEDRUN</span>
        </div>
        {/* Timer */}
        <span className="font-mono text-lg sm:text-xl text-red-400 tracking-wider tabular-nums">
          {formatTime(elapsedMs)}
        </span>
      </header>

      {/* Progress */}
      <div className="h-[3px] bg-noir-border/20"><div className="h-full bg-red-600/60 transition-all" style={{ width: `${(actIdx / 5) * 100}%` }} /></div>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="lg:w-[35%] flex items-center justify-center p-4">
          <div className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px]">
            <Skull3D scene={act.scene} className="w-full h-full" />
          </div>
        </div>

        <div className="lg:w-[65%] flex flex-col justify-center p-4 sm:p-8">
          <AnimatePresence mode="wait">
            {phase === "countdown" && (
              <motion.div key="cd" initial={{ opacity: 0, scale: 2 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
                <motion.p animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.8, repeat: 2 }} className="font-display text-4xl text-red-400">
                  PREPARADO
                </motion.p>
              </motion.div>
            )}

            {phase === "fragments" && actFragments[fragIdx] && (
              <motion.div key={`f-${actIdx}-${fragIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex gap-1 mb-3">{[0,1,2].map(i => <div key={i} className={`h-[2px] flex-1 ${i <= fragIdx ? "bg-red-500" : "bg-noir-border/30"}`} />)}</div>
                <FragmentComponent text={actFragments[fragIdx]?.text || ""} toneScore={actFragments[fragIdx]?.toneScore} fragmentId={actFragments[fragIdx]?.id} />
              </motion.div>
            )}

            {phase === "decision" && (
              <motion.div key="dec" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Countdown bar */}
                <div className="h-[4px] bg-noir-border/30 mb-6"><motion.div className="h-full bg-red-500" animate={{ width: `${(decisionCountdown / 10) * 100}%` }} transition={{ duration: 0.3 }} /></div>
                <p className="font-mono text-xs text-red-400 text-center mb-4">{decisionCountdown}s</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleDecision(act.decision.dark.text)} className="p-4 border-2 border-red-800/50 bg-noir-card text-left uxpm-press hover:bg-red-950/20">
                    <span className="text-[9px] text-red-400/70 uppercase tracking-wider block mb-1">Sombra</span>
                    <p className="font-display text-sm text-noir-text">{act.decision.dark.text}</p>
                  </button>
                  <button onClick={() => handleDecision(act.decision.light.text)} className="p-4 border-2 border-noir-accent/50 bg-noir-card text-left uxpm-press hover:bg-noir-accent/10">
                    <span className="text-[9px] text-noir-accent/70 uppercase tracking-wider block mb-1">Luz</span>
                    <p className="font-display text-sm text-noir-text">{act.decision.light.text}</p>
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div key="res" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                {isNewRecord && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-sm text-yellow-400 mb-2 tracking-wider">NUEVO RÉCORD</motion.p>}
                <p className="font-mono text-4xl sm:text-5xl text-red-400 mb-6 tabular-nums">{formatTime(elapsedMs)}</p>
                <div className="flex flex-col items-center gap-3">
                  {!saved && <button onClick={handleSave} className="px-6 py-2.5 border-2 border-noir-accent text-noir-accent font-display text-xs tracking-wider uxpm-press hover:bg-noir-accent/10">Guardar en leaderboard</button>}
                  {saved && <p className="text-green-500 text-xs font-body">✓ Guardado en 0G</p>}
                  <button onClick={() => router.push("/leaderboard")} className="px-6 py-2 border border-noir-border text-noir-muted font-display text-xs tracking-wider uxpm-press">Ver leaderboard</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Toast message={toast.message} hash={toast.hash} visible={toast.visible} onClose={() => setToast(p => ({ ...p, visible: false }))} />
    </div>
  );
}

export default function SpeedrunPage() {
  return <Providers><Suspense fallback={<div className="min-h-screen bg-noir-bg" />}><SpeedrunContent /></Suspense></Providers>;
}
