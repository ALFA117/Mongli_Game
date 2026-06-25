"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import FragmentComponent from "@/components/Fragment";
import GlitchText from "@/components/GlitchText";
import { initAudio, playChoice, startAudioOnFirstInteraction } from "@/lib/audio";
import { ACTS } from "@/lib/types";
import type { Fragment, GenerateResponse } from "@/lib/types";
import { useAccount } from "wagmi";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

function NightmareContent() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const [actIdx, setActIdx] = useState(0);
  const [phase, setPhase] = useState<"transition" | "fragments" | "decision" | "gameover" | "revelation">("transition");
  const [frags, setFrags] = useState<Fragment[]>([]);
  const [fragIdx, setFragIdx] = useState(0);
  const [fragDone, setFragDone] = useState(false);
  const [allFrags, setAllFrags] = useState<Fragment[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [skullFlicker, setSkullFlicker] = useState(false);
  const cdRef = useRef<ReturnType<typeof setInterval>>();
  const autoRef = useRef<ReturnType<typeof setTimeout>>();

  const act = ACTS[Math.min(actIdx, 2)];
  const TOTAL_ACTS = 3;

  useEffect(() => {
    initAudio();
    const s = () => startAudioOnFirstInteraction();
    document.addEventListener("click", s, { once: true });
    return () => document.removeEventListener("click", s);
  }, []);

  useEffect(() => { if (!isConnected) router.push("/"); }, [isConnected, router]);

  // Skull flicker
  useEffect(() => {
    const flicker = () => {
      setSkullFlicker(true);
      setTimeout(() => setSkullFlicker(false), 150);
    };
    const i = setInterval(flicker, 3000 + Math.random() * 5000);
    return () => clearInterval(i);
  }, []);

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => startAct(), 2000);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startAct = useCallback(async () => {
    setPhase("fragments"); setFrags([]); setFragIdx(0); setFragDone(false);
    const newFrags: Fragment[] = [];
    for (let i = 0; i < 3; i++) {
      try {
        const r = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: act.sceneDescription + " MODO PESADILLA: extremadamente oscuro, perturbador, sin esperanza. Máx 50 palabras. Horror psicológico puro. Frases incompletas.", history: allFrags, choice: "", fragmentId: allFrags.length + i + 1 }) });
        const d = await r.json() as GenerateResponse;
        newFrags.push(d.fragment);
      } catch {
        newFrags.push({ id: allFrags.length + i + 1, text: "...la oscuridad traga las palabras...", toneScore: 9, tags: ["horror"], traces: [], choiceMade: "", timestamp: Date.now(), unlocked: true });
      }
      setFrags([...newFrags]);
    }
  }, [act, allFrags]);

  const onFragDone = useCallback(() => {
    setFragDone(true);
    autoRef.current = setTimeout(() => {
      if (fragIdx < 2) { setFragIdx(p => p + 1); setFragDone(false); }
      else { setPhase("decision"); setCountdown(5); }
    }, 800);
  }, [fragIdx]);

  // Decision countdown — GAME OVER if 0
  useEffect(() => {
    if (phase !== "decision") return;
    cdRef.current = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { setPhase("gameover"); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => { if (cdRef.current) clearInterval(cdRef.current); };
  }, [phase]);

  const handleDecision = useCallback((text: string) => {
    if (cdRef.current) clearInterval(cdRef.current);
    playChoice();
    setAllFrags(p => [...p, ...frags]);
    if (actIdx < TOTAL_ACTS - 1) {
      setActIdx(p => p + 1);
      setPhase("transition");
      setTimeout(() => startAct(), 2000);
    } else {
      setPhase("revelation");
    }
  }, [frags, actIdx, startAct]);

  return (
    <div className="min-h-screen flex flex-col relative" style={{ filter: phase === "gameover" ? "none" : "hue-rotate(280deg) saturate(1.5)" }}>
      <Cursor /><ScanlineOverlay />

      <header className="flex items-center justify-between p-3 border-b border-noir-border/20 relative z-50">
        <div className="flex items-center gap-2">
          <button onClick={() => router.push("/")} className="font-display text-base text-noir-text tracking-[0.15em] hover:text-noir-accent"><GlitchText text="MONGLI" intensity="high" /></button>
          <span className="text-[9px] font-body text-red-400 border border-red-800/40 px-1.5 py-0.5 animate-pulse">▓ PESADILLA</span>
        </div>
        <span className="font-mono text-xs text-noir-muted">Acto {actIdx + 1}/{TOTAL_ACTS}</span>
      </header>

      <div className="h-[3px] bg-noir-border/20"><div className="h-full bg-red-600" style={{ width: `${((actIdx + (fragIdx / 3)) / TOTAL_ACTS) * 100}%` }} /></div>

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="lg:w-[35%] flex items-center justify-center p-4">
          <motion.div animate={{ opacity: skullFlicker ? 0.2 : 1 }} className="w-[150px] h-[150px] sm:w-[200px] sm:h-[200px]">
            <Skull3D scene="void" className="w-full h-full" />
          </motion.div>
        </div>

        <div className="lg:w-[65%] flex flex-col justify-center p-4 sm:p-8" style={{ filter: "hue-rotate(80deg)" }}>
          <AnimatePresence mode="wait">
            {phase === "transition" && (
              <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                <h2 className="font-display text-2xl text-noir-accent mb-2">ACTO {actIdx + 1}</h2>
                <p className="font-body text-[9px] text-noir-muted">{act.title}</p>
              </motion.div>
            )}

            {phase === "fragments" && frags[fragIdx] && (
              <motion.div key={`f-${actIdx}-${fragIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex gap-1 mb-3">{[0,1,2].map(i => <div key={i} className={`h-[2px] flex-1 ${i <= fragIdx ? "bg-red-600" : "bg-noir-border/30"}`} />)}</div>
                <FragmentComponent fragment={frags[fragIdx]} onComplete={onFragDone} />
              </motion.div>
            )}

            {phase === "decision" && (
              <motion.div key="dec" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="h-[4px] bg-noir-border/30 mb-4"><motion.div className="h-full bg-red-600" animate={{ width: `${(countdown / 5) * 100}%` }} /></div>
                <p className="font-mono text-xl text-red-400 text-center mb-4">{countdown}s</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleDecision(act.decision.dark.text)} className="p-4 border-2 border-red-800/60 bg-noir-card text-left uxpm-press">
                    <p className="font-display text-sm text-noir-text">{act.decision.dark.text}</p>
                  </button>
                  <button onClick={() => handleDecision(act.decision.light.text)} className="p-4 border-2 border-noir-border/40 bg-noir-card text-left uxpm-press">
                    <p className="font-display text-sm text-noir-text">{act.decision.light.text}</p>
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "gameover" && (
              <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <h2 className="font-display text-3xl text-red-500 mb-4"><GlitchText text="MEMORIA PERDIDA" intensity="high" /></h2>
                <p className="font-body text-xs text-noir-muted mb-8">El recuerdo se disolvió en la oscuridad. Para siempre.</p>
                <button onClick={() => { setActIdx(0); setAllFrags([]); setPhase("transition"); setTimeout(() => startAct(), 2000); }}
                  className="px-6 py-2.5 border-2 border-red-700 text-red-400 font-display text-xs uxpm-press">Intentar de nuevo</button>
              </motion.div>
            )}

            {phase === "revelation" && (
              <motion.div key="rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <p className="font-body text-[9px] text-noir-muted tracking-[0.4em] uppercase mb-4">Tu identidad</p>
                <h2 className="font-display text-4xl text-white mb-6"><GlitchText text="EL VACÍO" intensity="high" /></h2>
                <p className="font-display text-xs text-noir-text/50 max-w-sm mx-auto leading-relaxed mb-8">
                  No hay arquitecto. No hay testigo. No hay espejo. Solo el vacío que dejaste al despertar. Algunos recuerdos merecen perderse.
                </p>
                <button onClick={() => router.push("/")} className="px-8 py-3 border border-white/20 text-white/40 font-display text-xs tracking-wider uxpm-press">
                  CIERRA LOS OJOS
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function NightmarePage() {
  return <Providers><Suspense fallback={<div className="min-h-screen bg-black" />}><NightmareContent /></Suspense></Providers>;
}
