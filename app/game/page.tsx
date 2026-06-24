"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import HUD from "@/components/HUD";
import PixelCharacter from "@/components/PixelCharacter";
import LoadingScreen from "@/components/LoadingScreen";
import Toast from "@/components/Toast";
import ChainBeam from "@/components/ChainBeam";
import CSSRain from "@/components/CSSRain";
import MobileJoystick from "@/components/MobileJoystick";
import { useMovement, useIsMobile } from "@/lib/useMovement";
import { Fragment, Choice, GameState, INITIAL_SCENES, GenerateResponse } from "@/lib/types";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => <div style={{ position: "absolute", inset: 0, background: "#000" }} />,
});

function FragmentModal({ fragment, choices, isNew, isComplete, isLoading, onChoose, onClose }: {
  fragment: Fragment | null; choices: Choice[]; isNew: boolean; isComplete: boolean;
  isLoading: boolean; onChoose: (c: Choice) => void; onClose?: () => void;
}) {
  const [displayText, setDisplayText] = useState("");
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    if (!fragment) return;
    if (!isNew) { setDisplayText(fragment.text); setShowChoices(true); return; }
    setDisplayText(""); setShowChoices(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fragment.text.slice(0, i + 1));
      i++;
      if (i >= fragment.text.length) { clearInterval(interval); setTimeout(() => setShowChoices(true), 400); }
    }, 35);
    return () => clearInterval(interval);
  }, [fragment, isNew]);

  if (!fragment) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center px-3" style={{ zIndex: 50 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 51 }}
      >
        <div className="bg-black border border-red-900/30">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest">
                Fragmento #{String(fragment.id).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-[#c4923a]/30">
                {fragment.tone_score}/10
              </span>
            </div>
            {onClose && <button onClick={onClose} className="text-[#e8d5b0]/20 hover:text-[#e8d5b0]/60 cursor-pointer">✕</button>}
          </div>

          <div className="flex gap-0">
            <div className="hidden sm:flex items-center justify-center w-36 border-r border-[#1a1a1a] bg-[#030303] p-4">
              <PixelCharacter type={fragment.id <= 5 ? "witness" : fragment.id <= 12 ? "shadow" : "detective"} size={128} />
            </div>
            <div className="flex-1 p-4">
              {/* Sepia frame */}
              <div className="border border-[#c4923a]/10 p-3 bg-[#050503]" style={{
                borderImage: "linear-gradient(135deg, #c4923a33, #1a1a1a, #c4923a22) 1"
              }}>
                <p className="font-[family-name:var(--font-display)] text-[#e8d5b0] text-sm sm:text-base leading-relaxed min-h-[80px]">
                  {displayText}
                  {isNew && displayText.length < fragment.text.length && (
                    <span className="animate-pulse text-red-600">█</span>
                  )}
                </p>
              </div>

              {showChoices && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {fragment.tags.map((tag) => (
                      <span key={tag} className="text-[8px] text-red-400/30 border border-red-900/15 px-1 py-0.5 font-mono uppercase">{tag}</span>
                    ))}
                  </div>
                  {fragment.traces.length > 0 && fragment.traces.map((t) => (
                    <p key={t} className="text-[10px] text-[#c4923a]/25 font-mono italic">→ {t}</p>
                  ))}
                  {fragment.storage_hash && (
                    <div className="flex items-center gap-2 pt-1 border-t border-[#1a1a1a]">
                      <span className="text-[9px] text-green-500/60 font-mono">GRABADO EN CADENA ✓</span>
                      <span className="text-[9px] text-green-400/20 font-mono truncate">{fragment.storage_hash.slice(0, 18)}...</span>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {showChoices && choices.length > 0 && !isComplete && (
            <div className="border-t border-[#1a1a1a]">
              <div className="flex items-center gap-2 px-4 py-1.5">
                <div className="flex-1 h-[1px] bg-red-900/15" />
                <span className="text-[8px] font-mono text-red-500/25 uppercase tracking-[0.3em]">Elige tu destino</span>
                <div className="flex-1 h-[1px] bg-red-900/15" />
              </div>
              <div className="grid grid-cols-2">
                {choices.map((choice, i) => (
                  <button key={choice.id} onClick={() => onChoose(choice)} disabled={isLoading}
                    className={`group relative p-4 text-left font-mono text-sm cursor-pointer
                      transition-all duration-500 overflow-hidden
                      ${i === 0 ? "border-r border-[#1a1a1a]" : ""}
                      ${choice.tone === "dark" ? "text-red-200/50 hover:text-red-200/90" : "text-[#e8d5b0]/50 hover:text-[#e8d5b0]/90"}`}
                  >
                    <div className={`absolute bottom-0 left-0 w-full h-0 group-hover:h-full transition-all duration-700
                      ${choice.tone === "dark" ? "bg-red-950/40" : "bg-[#c4923a]/10"}`} />
                    <span className="relative z-10 block">
                      <span className={`text-[8px] uppercase tracking-widest block mb-1
                        ${choice.tone === "dark" ? "text-red-700/30" : "text-[#c4923a]/30"}`}>
                        Opción {i === 0 ? "A" : "B"}
                      </span>
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isComplete && showChoices && (
            <div className="border-t border-[#1a1a1a] p-5 text-center">
              <p className="font-[family-name:var(--font-display)] text-xl text-red-600/80 mb-1">Ahora sabes quién eres.</p>
              <p className="text-[10px] font-mono text-[#c4923a]/30">15 fragmentos grabados en 0G Chain</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const sceneId = searchParams.get("scene") || "alley";
  const isMobile = useIsMobile();
  const { pos, onMobileMove, onMobileStop } = useMovement({ minX: -200, maxX: 200, minY: -100, maxY: 100 });

  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<GameState>({
    fragments: [], current_act: 1, current_scene: "", choices: [], is_loading: false, is_complete: false,
  });
  const [reviewFragment, setReviewFragment] = useState<Fragment | null>(null);
  const [toastInfo, setToastInfo] = useState({ message: "", hash: "", visible: false });
  const [showBeam, setShowBeam] = useState(false);
  const [slowMsg, setSlowMsg] = useState(false);

  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];
  useEffect(() => { if (!isConnected) router.push("/"); }, [isConnected, router]);

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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: currentScene, choice: choiceText, history: state.fragments, fragment_id: fragmentId }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!response.ok) throw new Error("Error en la generación");
        const data: GenerateResponse = await response.json();
        const act = fragmentId <= 5 ? 1 : fragmentId <= 12 ? 2 : 3;

        setState((prev) => ({
          ...prev, fragments: [...prev.fragments, data.fragment],
          current_act: act as 1 | 2 | 3, current_scene: data.fragment.text,
          choices: fragmentId >= 15 ? [] : data.choices,
          is_loading: false, is_complete: fragmentId >= 15,
        }));

        if (data.fragment.storage_hash) {
          setShowBeam(true); setTimeout(() => setShowBeam(false), 1500);
          setToastInfo({ message: `Fragment #${String(fragmentId).padStart(2, "0")} saved`, hash: data.fragment.storage_hash, visible: true });
          setTimeout(() => setToastInfo((t) => ({ ...t, visible: false })), 4000);
        }
      } catch (error) {
        console.error(error);
        setState((prev) => ({ ...prev, is_loading: false }));
      } finally {
        clearTimeout(slowTimer);
        setSlowMsg(false);
      }
    },
    [state.fragments, state.current_scene, scene.description]
  );

  useEffect(() => {
    if (state.fragments.length === 0 && isConnected && loaded) generateFragment();
  }, [isConnected, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const latestFragment = state.fragments.length > 0 ? state.fragments[state.fragments.length - 1] : null;

  // Shadow approach vignette
  const shadowIntensity = state.fragments.length > 5 && state.fragments.length < 15
    ? Math.min((state.fragments.length - 5) / 10, 0.5) : 0;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#000" }}
      className="cursor-crosshair"
    >
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {loaded && (
        <>
          {/* Z0: 3D Background */}
          <Scene3D />

          {/* Z1-Z4: Overlays */}
          <CSSRain />
          <div className="static-noise absolute inset-0" style={{ zIndex: 2 }} />
          <div className="scanlines absolute inset-0" style={{ zIndex: 3 }} />
          <div className="absolute inset-0" style={{
            zIndex: 4, pointerEvents: "none",
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(${shadowIntensity > 0 ? "139,0,0" : "0,0,0"},${0.7 + shadowIntensity}) 100%)`
          }} />

          {/* Z5: Characters */}
          <div className="absolute inset-0" style={{ zIndex: 5, pointerEvents: "none" }}>
            {/* Player */}
            <div style={{
              position: "absolute",
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(55% + ${pos.y}px)`,
              transform: "translate(-50%, -50%)",
              transition: "left 0.05s, top 0.05s",
            }}>
              <div style={{ animation: "float 2s ease-in-out infinite" }}>
                <PixelCharacter type="detective" size={96} />
              </div>
              <div className="char-shadow mx-auto" />
            </div>

            {/* NPC */}
            {state.fragments.length < 15 && (
              <div style={{
                position: "absolute",
                left: `calc(65% + ${pos.x * -0.2}px)`,
                top: `calc(50% + ${pos.y * -0.1}px)`,
                transform: "translate(-50%, -50%)",
              }}>
                <div style={{ animation: "float 2.5s ease-in-out infinite 0.3s" }}>
                  <PixelCharacter type={state.fragments.length <= 5 ? "witness" : "shadow"} size={96} />
                </div>
                <div className="char-shadow mx-auto" />
              </div>
            )}
          </div>

          {/* Z10: HUD */}
          <HUD
            fragmentCount={state.fragments.length}
            currentAct={state.current_act}
            latestFragment={latestFragment}
            fragments={state.fragments}
            onMapNodeClick={(f) => setReviewFragment(f)}
          />

          {/* Z10: Interact prompt */}
          {!state.is_loading && latestFragment && !reviewFragment && (
            <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2" style={{ zIndex: 10 }}>
              <p className="font-mono text-[10px] sm:text-[11px] text-[#e8d5b0]/30 bg-black/70 border border-[#c4923a]/10 px-3 py-1.5 whitespace-nowrap">
                {isMobile ? "Toca RECORDAR para ver el fragmento" : "[E] Interactuar · WASD para mover"}
              </p>
            </div>
          )}

          {/* Z10: Mobile controls */}
          {isMobile && (
            <>
              <div className="absolute bottom-4 left-4" style={{ zIndex: 40 }}>
                <MobileJoystick onMove={onMobileMove} onStop={onMobileStop} />
              </div>
              {latestFragment && !state.is_loading && (
                <button
                  onClick={() => {/* modal is always shown */}}
                  className="absolute bottom-6 right-4 w-16 h-16 rounded-full border border-red-900/40 bg-black/80 flex items-center justify-center font-mono text-[8px] text-red-400/60 uppercase tracking-wider active:bg-red-950/30"
                  style={{ zIndex: 40 }}
                >
                  Recordar
                </button>
              )}
            </>
          )}

          {/* Loading overlay */}
          <AnimatePresence>
            {state.is_loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm"
                style={{ zIndex: 50 }}
              >
                <div className="relative w-14 h-14 mb-6">
                  <div className="absolute inset-0 border border-red-900/40 rounded-full animate-ping" />
                  <div className="absolute inset-2 border border-[#c4923a]/30 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
                </div>
                <p className="font-mono text-xs text-[#c4923a]/50 tracking-wider animate-pulse">
                  {slowMsg ? "La memoria resiste... un momento más" : "Accediendo a memoria..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fragment modal */}
          <AnimatePresence>
            {latestFragment && !state.is_loading && !reviewFragment && (
              <FragmentModal fragment={latestFragment} choices={state.choices}
                isNew={latestFragment.id === state.fragments.length}
                isComplete={state.is_complete} isLoading={state.is_loading}
                onChoose={(c) => generateFragment(c.text)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {reviewFragment && (
              <FragmentModal fragment={reviewFragment} choices={[]} isNew={false}
                isComplete={false} isLoading={false} onChoose={() => {}}
                onClose={() => setReviewFragment(null)}
              />
            )}
          </AnimatePresence>

          <ChainBeam visible={showBeam} />
          <Toast message={toastInfo.message} hash={toastInfo.hash} visible={toastInfo.visible} />
        </>
      )}

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
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
