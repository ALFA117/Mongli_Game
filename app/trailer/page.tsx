"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

type TrailerScene = 1 | 2 | 3 | 4 | 5 | 6;

const DEMO_FRAGMENT = "Desperté sin saber mi nombre. La habitación olía a tabaco frío y promesas rotas. En el espejo, un extraño me miraba con mis propios ojos. Una maleta abierta en la esquina — ropa que no reconozco pero que huele a mí. En el bolsillo, una nota: 'No confíes en lo que recuerdes primero.'";

function useTypewriter(text: string, active: boolean, speed = 70) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const tick = () => {
      if (i >= text.length) { setDone(true); return; }
      setDisplayed(text.slice(0, ++i));
      setTimeout(tick, text[i - 1] === "." ? 200 : speed);
    };
    setTimeout(tick, 800);
    return () => { i = text.length; };
  }, [text, active, speed]);
  return { displayed, done };
}

export default function TrailerPage() {
  const router = useRouter();
  const [scene, setScene] = useState<TrailerScene>(1);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const totalDuration = 90;
  const progress = (elapsed / totalDuration) * 100;

  const { displayed: fragText, done: fragDone } = useTypewriter(DEMO_FRAGMENT, scene === 2);

  // Timer
  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setElapsed(p => {
        const next = p + 0.1;
        if (next >= totalDuration) { clearInterval(timerRef.current); setScene(1); return 0; } // Loop
        // Scene transitions
        if (next >= 75) setScene(6);
        else if (next >= 55) setScene(5);
        else if (next >= 40) setScene(4);
        else if (next >= 25) setScene(3);
        else if (next >= 10) setScene(2);
        else setScene(1);
        return next;
      });
    }, 100);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paused]);

  const handleClick = () => setPaused(p => !p);

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden" onClick={handleClick}>
      <Cursor />
      <ScanlineOverlay />

      {/* Skip button */}
      <div className="absolute top-3 right-3 z-50 flex items-center gap-2">
        {paused && <span className="font-body text-[9px] text-noir-muted">pausado</span>}
        <button onClick={(e) => { e.stopPropagation(); router.push("/"); }}
          className="font-body text-[9px] text-noir-muted/40 hover:text-noir-accent px-2 py-1 border border-noir-border/20 uxpm-press">
          skip →
        </button>
      </div>

      {/* Scenes */}
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <AnimatePresence mode="wait">
          {/* Scene 1: Title */}
          {scene === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="w-[200px] h-[200px] mx-auto mb-6"><Skull3D scene="void" className="w-full h-full" /></div>
              <h1 className="font-display text-4xl sm:text-6xl text-noir-text text-shadow-noir tracking-[0.2em] mb-3">
                <GlitchText text="MONGLI" intensity="medium" />
              </h1>
              <p className="font-body text-xs text-noir-accent tracking-[0.3em]">Tu memoria vive en la blockchain</p>
            </motion.div>
          )}

          {/* Scene 2: The Fragment */}
          {scene === 2 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg relative">
              <div className="absolute -left-20 top-0 w-[120px] h-[120px] opacity-20"><Skull3D scene="hotel" className="w-full h-full" /></div>
              <p className="font-body text-[8px] text-noir-muted tracking-[0.4em] uppercase mb-4">Acto I · El Despertar</p>
              <p className="font-display text-sm sm:text-base text-noir-text leading-[1.9]">
                {fragText}
                {!fragDone && <span className="inline-block w-[2px] h-[1em] bg-noir-accent/60 ml-0.5 animate-pulse align-middle" />}
              </p>
            </motion.div>
          )}

          {/* Scene 3: The Decision */}
          {scene === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-md w-full">
              <p className="font-body text-[9px] text-noir-accent tracking-[0.3em] uppercase mb-4 text-center">Tu decisión</p>
              <div className="space-y-3">
                <div className="p-4 border-2 border-red-800/50 bg-noir-card"><p className="font-display text-sm text-noir-text">Abres la puerta — enfrentar lo que hay afuera</p></div>
                <motion.div animate={{ borderColor: ["rgba(212,162,68,0.5)", "rgba(212,162,68,0.9)", "rgba(212,162,68,0.5)"] }} transition={{ duration: 1, repeat: 2 }}
                  className="p-4 border-2 bg-noir-card"><p className="font-display text-sm text-noir-text">Esperas en silencio — escuchas antes de actuar</p></motion.div>
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
                className="text-center mt-4 text-[9px] font-body text-green-500/60">Decisión guardada en 0G Chain ✓ 0x7f3a...c91d</motion.p>
            </motion.div>
          )}

          {/* Scene 4: Map */}
          {scene === 4 && (
            <motion.div key="s4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="font-body text-xs text-noir-muted mb-6">Cada fragmento, permanente en la blockchain</p>
              <div className="flex justify-center gap-4">
                {[1,2,3,4,5].map((n,i) => (
                  <motion.div key={n} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.3 }}
                    className="w-8 h-8 rounded-full border-2 border-noir-accent flex items-center justify-center text-[10px] text-noir-accent font-mono"
                    style={{ boxShadow: "0 0 10px rgba(212,162,68,0.3)" }}>{n}</motion.div>
                ))}
              </div>
              <svg className="w-[250px] h-[10px] mx-auto mt-3" viewBox="0 0 250 10">
                {[0,1,2,3].map(i => <motion.line key={i} x1={30 + i * 50} y1={5} x2={70 + i * 50} y2={5} stroke="#d4a244" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: i * 0.3 + 0.5 }} />)}
              </svg>
            </motion.div>
          )}

          {/* Scene 5: Revelation */}
          {scene === 5 && (
            <motion.div key="s5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
              <p className="font-body text-[9px] text-noir-muted tracking-[0.4em] uppercase mb-6">Al final, descubrirás quién eres</p>
              <h2 className="font-display text-3xl sm:text-5xl text-red-500">
                <GlitchText text="EL ARQUITECTO" intensity="high" />
              </h2>
            </motion.div>
          )}

          {/* Scene 6: CTA */}
          {scene === 6 && (
            <motion.div key="s6" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center">
              <div className="w-[100px] h-[100px] mx-auto mb-6 opacity-30"><Skull3D scene="archive" className="w-full h-full" /></div>
              <p className="font-body text-[9px] text-noir-muted tracking-[0.3em] uppercase mb-2">Zero Cup 2026 · 0G Labs</p>
              <h2 className="font-display text-2xl text-noir-text mb-6">Built on 0G</h2>
              <motion.button onClick={(e) => { e.stopPropagation(); router.push("/"); }}
                whileHover={{ scale: 1.05 }}
                animate={{ boxShadow: ["0 0 10px rgba(212,162,68,0.2)", "0 0 25px rgba(212,162,68,0.5)", "0 0 10px rgba(212,162,68,0.2)"] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-10 py-3.5 border-2 border-noir-accent text-noir-accent font-display text-sm tracking-[0.2em] uxpm-press">
                DESPERTAR →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Progress bar */}
      <div className="h-[2px] bg-noir-border/10">
        <div className="h-full bg-noir-accent/40 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
