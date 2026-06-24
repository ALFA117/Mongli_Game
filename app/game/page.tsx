"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import PathMap from "@/components/PathMap";
import PixelCharacter from "@/components/PixelCharacter";
import LoadingScreen from "@/components/LoadingScreen";
import Toast from "@/components/Toast";
import ChainBeam from "@/components/ChainBeam";
import CSSRain from "@/components/CSSRain";
import FloatingDust from "@/components/FloatingDust";
import GlitchFlash from "@/components/GlitchFlash";
import CursorGlow from "@/components/CursorGlow";
import WalletButton from "@/components/WalletButton";
import { toggleAmbientAudio } from "@/lib/ambientAudio";
import { Fragment, Choice, GameState, INITIAL_SCENES, GenerateResponse } from "@/lib/types";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "#000" }} />,
});

const ACT_NAMES: Record<number, string> = { 1: "LA AMNESIA", 2: "EL DESDOBLAMIENTO", 3: "LA REVELACIÓN" };

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const sceneId = searchParams.get("scene") || "alley";

  const [loaded, setLoaded] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [state, setState] = useState<GameState>({
    fragments: [], current_act: 1, current_scene: "", choices: [], is_loading: false, is_complete: false,
  });
  const [reviewFragment, setReviewFragment] = useState<Fragment | null>(null);
  const [toastInfo, setToastInfo] = useState({ message: "", hash: "", visible: false });
  const [showBeam, setShowBeam] = useState(false);
  const [slowMsg, setSlowMsg] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [showChoices, setShowChoices] = useState(false);

  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];
  useEffect(() => { if (!isConnected) router.push("/"); }, [isConnected, router]);

  const latestFragment = state.fragments.length > 0 ? state.fragments[state.fragments.length - 1] : null;
  const activeFragment = reviewFragment || latestFragment;

  // Typewriter for active fragment
  useEffect(() => {
    if (!activeFragment) return;
    if (reviewFragment) { setDisplayText(activeFragment.text); setShowChoices(true); return; }
    setDisplayText(""); setShowChoices(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(activeFragment.text.slice(0, i + 1));
      i++;
      if (i >= activeFragment.text.length) { clearInterval(interval); setTimeout(() => setShowChoices(true), 400); }
    }, 30);
    return () => clearInterval(interval);
  }, [activeFragment, reviewFragment]);

  const generateFragment = useCallback(
    async (choiceText: string = "") => {
      setState((prev) => ({ ...prev, is_loading: true }));
      setSlowMsg(false);
      const slowTimer = setTimeout(() => setSlowMsg(true), 8000);
      const fragmentId = state.fragments.length + 1;
      const currentScene = fragmentId === 1 ? scene.description : state.current_scene;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const response = await fetch("/api/generate", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: currentScene, choice: choiceText, history: state.fragments, fragment_id: fragmentId }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) throw new Error("Error");
        const data: GenerateResponse = await response.json();
        const act = fragmentId <= 5 ? 1 : fragmentId <= 12 ? 2 : 3;
        setState((prev) => ({
          ...prev, fragments: [...prev.fragments, data.fragment],
          current_act: act as 1 | 2 | 3, current_scene: data.fragment.text,
          choices: fragmentId >= 15 ? [] : data.choices, is_loading: false, is_complete: fragmentId >= 15,
        }));
        if (data.fragment.storage_hash) {
          setShowBeam(true); setTimeout(() => setShowBeam(false), 1500);
          setToastInfo({ message: `Fragment #${String(fragmentId).padStart(2, "0")} saved`, hash: data.fragment.storage_hash, visible: true });
          setTimeout(() => setToastInfo((t) => ({ ...t, visible: false })), 4000);
        }
      } catch (e) { console.error(e); setState((prev) => ({ ...prev, is_loading: false })); }
      finally { clearTimeout(slowTimer); setSlowMsg(false); }
    },
    [state.fragments, state.current_scene, scene.description]
  );

  useEffect(() => {
    if (state.fragments.length === 0 && isConnected && loaded) generateFragment();
  }, [isConnected, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#000" }} className="cursor-crosshair">
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {loaded && (
        <>
          <Scene3D />
          <CSSRain />
          <div className="static-noise absolute inset-0" style={{ zIndex: 2 }} />
          <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: "none", boxShadow: "inset 0 0 150px #000, inset 0 0 80px rgba(0,0,0,0.7)" }} />
          <FloatingDust />
          <GlitchFlash />
          <CursorGlow />

          {/* CSS Grid layout */}
          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "grid", gridTemplateRows: "50px 1fr 120px", gridTemplateColumns: "280px 1fr", overflow: "hidden" }}>

            {/* HUD TOP */}
            <div style={{ gridColumn: "1 / -1", gridRow: 1 }} className="flex items-center justify-between px-4 border-b border-red-900/15 bg-black/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <h1 onClick={() => router.push("/")} className="font-[family-name:var(--font-display)] text-lg text-red-700/70 cursor-pointer hover-shake">MONGLI</h1>
                <span className="hidden sm:inline text-[10px] font-mono text-red-500/40 uppercase tracking-widest">Acto {state.current_act} — {ACT_NAMES[state.current_act]}</span>
                <span className="hidden sm:inline text-[#2a2a2a]">│</span>
                <span className="text-[10px] font-mono text-[#c4923a]/40">Fragmento {String(state.fragments.length).padStart(2, "0")}/15</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 animate-pulse" />Galileo
                </span>
                <button onClick={() => setAudioOn(toggleAmbientAudio())} className="text-[10px] font-mono text-red-400/30 hover:text-red-400 cursor-pointer">{audioOn ? "🔊" : "🔇"}</button>
                <WalletButton />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ gridColumn: "1 / -1", gridRow: 1, alignSelf: "end" }} className="h-[2px] bg-[#0a0a0a]">
              <motion.div className="h-full bg-gradient-to-r from-red-900 to-[#c4923a]" animate={{ width: `${(state.fragments.length / 15) * 100}%` }} transition={{ duration: 0.8 }} />
            </div>

            {/* LEFT: Map */}
            <div style={{ gridColumn: 1, gridRow: 2 }} className="hidden sm:flex flex-col border-r border-red-900/10 bg-black/40 backdrop-blur-sm overflow-y-auto p-4">
              <p className="text-[8px] font-mono text-red-500/25 uppercase tracking-[0.2em] mb-3 text-center">Mapa de recuerdos</p>
              <PathMap fragments={state.fragments} currentId={state.fragments.length} onSelect={(f) => setReviewFragment(f)} />
              <div className="mt-4 flex items-center justify-center gap-3">
                <PixelCharacter type="detective" size={48} />
                {state.fragments.length < 15 && (
                  <div style={{ animation: state.fragments.length > 5 ? "shadow-aura 2s ease-in-out infinite" : "none" }}>
                    <PixelCharacter type={state.fragments.length <= 5 ? "witness" : "shadow"} size={48} />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Fragment */}
            <div style={{ gridColumn: "1 / -1", gridRow: 2 }} className="sm:col-start-2 sm:col-end-3 overflow-y-auto p-4 sm:p-6 flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {state.is_loading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8">
                    <div className="relative w-14 h-14 mx-auto mb-5">
                      <div className="absolute inset-0 border border-red-900/40 rounded-full animate-ping" />
                      <div className="absolute inset-2 border border-[#c4923a]/30 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
                    </div>
                    <p className="font-mono text-xs text-[#c4923a]/50 animate-pulse">
                      {slowMsg ? "La memoria resiste... un momento más" : "Accediendo a memoria..."}
                    </p>
                  </motion.div>
                ) : activeFragment ? (
                  <motion.div key={`frag-${activeFragment.id}-${!!reviewFragment}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto w-full">
                    {reviewFragment && (
                      <button onClick={() => setReviewFragment(null)} className="text-[10px] font-mono text-red-500/30 hover:text-red-400 mb-3 cursor-pointer">← volver al presente</button>
                    )}
                    <div className="flex gap-0 border border-red-900/20 bg-black/80">
                      <div className="hidden sm:flex items-center justify-center w-32 border-r border-[#1a1a1a] bg-[#030303] p-3">
                        <PixelCharacter type={activeFragment.id <= 5 ? "witness" : activeFragment.id <= 12 ? "shadow" : "detective"} size={100} />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[9px] font-mono text-red-500/50 uppercase tracking-widest">Fragmento #{String(activeFragment.id).padStart(2, "0")}</span>
                          <span className="text-[9px] font-mono text-[#c4923a]/25">{activeFragment.tone_score}/10</span>
                        </div>
                        <div className="border border-[#c4923a]/8 p-3 bg-[#040402]" style={{ borderImage: "linear-gradient(135deg, #c4923a22, #1a1a1a, #c4923a15) 1" }}>
                          <p className="font-[family-name:var(--font-display)] text-[#e8d5b0] text-sm leading-relaxed min-h-[80px]">
                            {displayText}
                            {!reviewFragment && displayText.length < activeFragment.text.length && <span className="animate-pulse text-red-600">█</span>}
                          </p>
                        </div>
                        {showChoices && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-1.5">
                            <div className="flex flex-wrap gap-1">
                              {activeFragment.tags.map((t) => <span key={t} className="text-[8px] text-red-400/25 border border-red-900/10 px-1 py-0.5 font-mono uppercase">{t}</span>)}
                            </div>
                            {activeFragment.traces.map((t) => <p key={t} className="text-[10px] text-[#c4923a]/20 font-mono italic">→ {t}</p>)}
                            {activeFragment.storage_hash && (
                              <div className="flex items-center gap-2 pt-1.5 border-t border-[#1a1a1a]">
                                <span className="text-[8px] text-green-500/50 font-mono">GRABADO EN CADENA ✓</span>
                                <span className="text-[8px] text-green-400/20 font-mono truncate">{activeFragment.storage_hash.slice(0, 16)}...</span>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* BOTTOM: Choices */}
            <div style={{ gridColumn: "1 / -1", gridRow: 3 }} className="border-t border-red-900/15 bg-black/80 backdrop-blur-sm">
              {showChoices && state.choices.length > 0 && !state.is_complete && !reviewFragment && !state.is_loading ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <div className="flex-1 h-[1px] bg-red-900/12" />
                    <span className="text-[8px] font-mono text-red-500/20 uppercase tracking-[0.3em]">Elige tu destino</span>
                    <div className="flex-1 h-[1px] bg-red-900/12" />
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-0">
                    {state.choices.map((choice, i) => (
                      <button key={choice.id} onClick={() => generateFragment(choice.text)}
                        className={`group relative text-left font-mono text-sm cursor-pointer transition-all duration-500 overflow-hidden px-5 py-3 ${i === 0 ? "border-r border-[#1a1a1a]" : ""} ${choice.tone === "dark" ? "text-red-200/50 hover:text-red-200/90" : "text-[#e8d5b0]/50 hover:text-[#e8d5b0]/90"}`}>
                        <div className={`absolute bottom-0 left-0 w-full h-0 group-hover:h-full transition-all duration-700 ${choice.tone === "dark" ? "bg-red-950/40" : "bg-[#c4923a]/10"}`} />
                        <span className="relative z-10 block">
                          <span className={`text-[8px] uppercase tracking-widest block mb-1 ${choice.tone === "dark" ? "text-red-700/25" : "text-[#c4923a]/25"}`}>Opción {i === 0 ? "A" : "B"}</span>
                          {choice.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : state.is_complete ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-[family-name:var(--font-display)] text-xl text-red-600/70">Ahora sabes quién eres.</p>
                    <p className="text-[10px] font-mono text-[#c4923a]/25 mt-1">15 fragmentos grabados en 0G Chain</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="font-mono text-[10px] text-[#e8d5b0]/15">
                    {state.is_loading ? "Generando..." : "Esperando fragmento..."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <ChainBeam visible={showBeam} />
          <Toast message={toastInfo.message} hash={toastInfo.hash} visible={toastInfo.visible} />
        </>
      )}

      <style jsx>{`
        @keyframes shadow-aura {
          0%,100% { filter: drop-shadow(0 0 4px rgba(139,0,0,0.3)); }
          50% { filter: drop-shadow(0 0 15px rgba(139,0,0,0.6)); }
        }
      `}</style>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div style={{ width: "100vw", height: "100vh", background: "#000" }} />}>
      <GameContent />
    </Suspense>
  );
}
