"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";
import { ACTS } from "@/lib/types";
import type { ActRecord } from "@/lib/types";
import { useKeyboardNav } from "@/lib/useKeyboardNav";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

function useTypewriter(text: string, speed = 30) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    const tick = () => {
      if (i >= text.length) { setDone(true); return; }
      setDisplayed(text.slice(0, ++i));
      setTimeout(tick, text[i - 1] === "." ? 150 : speed);
    };
    setTimeout(tick, 500);
    return () => { i = text.length; };
  }, [text, speed]);
  return { displayed, done };
}

function ReplayContent() {
  const params = useSearchParams();
  const router = useRouter();
  const wallet = params.get("wallet") || "";

  const [acts, setActs] = useState<ActRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [currentFragIdx, setCurrentFragIdx] = useState(0);
  const [showDecision, setShowDecision] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load history
  useEffect(() => {
    if (!wallet) { setLoading(false); return; }
    fetch(`/api/save?wallet=${wallet}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.exists && data.completedActs?.length > 0) {
          setActs(data.completedActs);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [wallet]);

  const currentAct = acts[currentActIdx];
  const currentFrag = currentAct?.fragments?.[currentFragIdx];
  const actDef = ACTS[currentActIdx] || ACTS[0];
  const totalFrags = acts.reduce((s, a) => s + (a.fragments?.length || 0), 0);
  const currentGlobalFrag = acts.slice(0, currentActIdx).reduce((s, a) => s + (a.fragments?.length || 0), 0) + currentFragIdx + 1;
  const progressPercent = totalFrags > 0 ? (currentGlobalFrag / totalFrags) * 100 : 0;

  const { displayed, done } = useTypewriter(currentFrag?.text || "", 25);

  // Auto-advance when typewriter finishes
  useEffect(() => {
    if (!done || paused || showDecision || finished) return;
    timerRef.current = setTimeout(() => {
      if (currentFragIdx < (currentAct?.fragments?.length || 0) - 1) {
        setCurrentFragIdx((p) => p + 1);
      } else {
        setShowDecision(true);
        setTimeout(() => {
          setShowDecision(false);
          if (currentActIdx < acts.length - 1) {
            setCurrentActIdx((p) => p + 1);
            setCurrentFragIdx(0);
          } else {
            setFinished(true);
          }
        }, 4000);
      }
    }, 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [done, paused, showDecision, finished, currentFragIdx, currentActIdx, currentAct, acts.length]);

  useKeyboardNav({
    onEscape: () => router.push("/history"),
    onEnter: () => setPaused((p) => !p),
    onLeft: () => {
      if (currentFragIdx > 0) setCurrentFragIdx((p) => p - 1);
      else if (currentActIdx > 0) { setCurrentActIdx((p) => p - 1); setCurrentFragIdx(0); }
    },
    onRight: () => {
      if (currentFragIdx < (currentAct?.fragments?.length || 0) - 1) setCurrentFragIdx((p) => p + 1);
      else if (currentActIdx < acts.length - 1) { setCurrentActIdx((p) => p + 1); setCurrentFragIdx(0); }
    },
    enabled: !loading,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border border-noir-accent/40 border-t-noir-accent rounded-full" />
      </div>
    );
  }

  if (acts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <p className="font-display text-noir-muted text-sm mb-4">No hay historia que reproducir</p>
        <button onClick={() => router.push("/")}
          className="px-6 py-2 border border-noir-accent text-noir-accent font-display text-xs uxpm-press">
          Ir al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      <Cursor />
      <ScanlineOverlay />

      {/* Skull background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-15 pointer-events-none">
        <div className="w-[400px] h-[400px]"><Skull3D scene={actDef.scene} className="w-full h-full" /></div>
      </div>

      {/* Top bar */}
      <div className="flex items-center justify-between p-3 relative z-10">
        <span className="font-body text-[9px] text-noir-muted/40">
          Acto {currentActIdx + 1}/{acts.length} · Fragmento {currentFragIdx + 1}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={() => setPaused((p) => !p)}
            className="font-body text-[10px] text-noir-muted hover:text-noir-accent uxpm-press px-2 py-1 border border-noir-border/30">
            {paused ? "▶" : "❚❚"}
          </button>
          <button onClick={() => router.push("/history")}
            className="font-body text-[10px] text-noir-muted hover:text-noir-accent uxpm-press">
            Salir
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        <AnimatePresence mode="wait">
          {showDecision && currentAct ? (
            <motion.div key="decision" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }} className="text-center">
              <p className="font-body text-[9px] text-noir-muted tracking-[0.3em] uppercase mb-3">Decisión</p>
              <p className="font-display text-lg sm:text-xl text-noir-accent max-w-md leading-relaxed">
                &ldquo;{currentAct.decision}&rdquo;
              </p>
            </motion.div>
          ) : finished ? (
            <motion.div key="fin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <h2 className="font-display text-2xl text-noir-accent mb-4">
                <GlitchText text="FIN DE LA MEMORIA" intensity="low" />
              </h2>
              <div className="flex gap-3 justify-center mt-8">
                <button onClick={() => router.push("/history")}
                  className="px-6 py-2.5 border border-noir-accent text-noir-accent font-display text-xs tracking-wider uxpm-press">
                  Expediente
                </button>
                <button onClick={() => router.push("/")}
                  className="px-6 py-2.5 border border-noir-border text-noir-muted font-display text-xs tracking-wider uxpm-press">
                  Inicio
                </button>
              </div>
            </motion.div>
          ) : currentFrag ? (
            <motion.div key={`${currentActIdx}-${currentFragIdx}`}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="max-w-lg">
              <p className="font-body text-[8px] text-noir-muted/30 tracking-[0.4em] uppercase mb-4 text-center">
                Acto {currentActIdx + 1}: {actDef.title}
              </p>
              <p className="font-display text-sm sm:text-base text-noir-text leading-[1.9] tracking-wide">
                {displayed}
                {!done && <span className="inline-block w-[2px] h-[1em] bg-noir-accent/60 ml-0.5 animate-pulse align-middle" />}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {paused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <p className="font-display text-xl text-noir-accent animate-pulse">PAUSA</p>
          </motion.div>
        )}
      </main>

      {/* Progress bar */}
      <div className="h-[2px] bg-noir-border/10 relative z-10">
        <motion.div className="h-full bg-noir-accent/60"
          animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

export default function ReplayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ReplayContent />
    </Suspense>
  );
}
