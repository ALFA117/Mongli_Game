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
import {
  Fragment,
  Choice,
  GameState,
  INITIAL_SCENES,
  GenerateResponse,
} from "@/lib/types";

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false });

function FragmentModal({
  fragment,
  choices,
  isNew,
  isComplete,
  isLoading,
  onChoose,
  onClose,
}: {
  fragment: Fragment | null;
  choices: Choice[];
  isNew: boolean;
  isComplete: boolean;
  isLoading: boolean;
  onChoose: (c: Choice) => void;
  onClose?: () => void;
}) {
  const [displayText, setDisplayText] = useState("");
  const [showChoices, setShowChoices] = useState(false);

  useEffect(() => {
    if (!fragment) return;
    if (!isNew) {
      setDisplayText(fragment.text);
      setShowChoices(true);
      return;
    }
    setDisplayText("");
    setShowChoices(false);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fragment.text.slice(0, i + 1));
      i++;
      if (i >= fragment.text.length) {
        clearInterval(interval);
        setTimeout(() => setShowChoices(true), 500);
      }
    }, 35);
    return () => clearInterval(interval);
  }, [fragment, isNew]);

  if (!fragment) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className="bg-black border border-red-900/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest">
                Fragmento #{String(fragment.id).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-[#c4923a]/30">
                Intensidad: {fragment.tone_score}/10
              </span>
            </div>
            {onClose && (
              <button onClick={onClose} className="text-[#e8d5b0]/20 hover:text-[#e8d5b0]/60 transition-colors cursor-pointer text-sm">✕</button>
            )}
          </div>

          {/* Content */}
          <div className="flex gap-0">
            {/* Character */}
            <div className="hidden sm:flex items-center justify-center w-40 border-r border-[#1a1a1a] bg-[#050505]">
              <PixelCharacter
                type={fragment.id <= 5 ? "witness" : fragment.id <= 12 ? "shadow" : "detective"}
                size={128}
              />
            </div>

            {/* Text */}
            <div className="flex-1 p-5">
              <p className="font-[family-name:var(--font-display)] text-[#e8d5b0] text-base leading-relaxed min-h-[100px]">
                {displayText}
                {isNew && displayText.length < fragment.text.length && (
                  <span className="animate-pulse text-red-600">█</span>
                )}
              </p>

              {/* Tags */}
              {showChoices && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {fragment.tags.map((tag) => (
                      <span key={tag} className="text-[9px] text-red-400/30 border border-red-900/15 px-1.5 py-0.5 font-mono uppercase">{tag}</span>
                    ))}
                  </div>
                  {fragment.traces.length > 0 && (
                    <div className="border-t border-[#1a1a1a] pt-2 mb-3">
                      {fragment.traces.map((t) => (
                        <p key={t} className="text-[10px] text-[#c4923a]/30 font-mono italic">→ {t}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* On-chain status */}
              {fragment.storage_hash && showChoices && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-[#1a1a1a] pt-2 mt-2 flex items-center gap-2"
                >
                  <span className="text-[9px] text-green-500/60 font-mono">GRABADO EN CADENA ✓</span>
                  <span className="text-[9px] text-green-400/25 font-mono truncate">{fragment.storage_hash.slice(0, 20)}...</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Choices */}
          {showChoices && choices.length > 0 && !isComplete && (
            <div className="border-t border-[#1a1a1a]">
              <div className="flex items-center gap-3 px-5 py-2">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-red-900/20" />
                <span className="text-[9px] font-mono text-red-500/30 uppercase tracking-[0.3em]">Elige tu destino</span>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-red-900/20" />
              </div>
              <div className="grid grid-cols-2 gap-0">
                {choices.map((choice, i) => (
                  <button
                    key={choice.id}
                    onClick={() => onChoose(choice)}
                    disabled={isLoading}
                    className={`group relative p-5 text-left font-mono text-sm overflow-hidden
                      transition-all duration-500 cursor-pointer
                      ${i === 0 ? "border-r border-[#1a1a1a]" : ""}
                      ${choice.tone === "dark"
                        ? "text-red-200/60 hover:text-red-200/90"
                        : "text-[#e8d5b0]/60 hover:text-[#e8d5b0]/90"
                      }`}
                  >
                    <div className={`absolute inset-0 h-0 group-hover:h-full transition-all duration-700 ease-out
                      ${choice.tone === "dark" ? "bg-red-950/40" : "bg-[#c4923a]/10"}`}
                      style={{ bottom: 0, top: "auto" }}
                    />
                    <span className="relative z-10 block">
                      <span className={`text-[9px] uppercase tracking-widest block mb-1
                        ${choice.tone === "dark" ? "text-red-700/40" : "text-[#c4923a]/40"}`}>
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
            <div className="border-t border-[#1a1a1a] p-6 text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl text-red-600/80 mb-1">
                Ahora sabes quién eres.
              </p>
              <p className="text-[10px] font-mono text-[#c4923a]/30">
                15 fragmentos grabados permanentemente en 0G Chain
              </p>
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

  const [loaded, setLoaded] = useState(false);
  const [state, setState] = useState<GameState>({
    fragments: [], current_act: 1, current_scene: "",
    choices: [], is_loading: false, is_complete: false,
  });
  const [reviewFragment, setReviewFragment] = useState<Fragment | null>(null);
  const [toastInfo, setToastInfo] = useState({ message: "", hash: "", visible: false });
  const [showBeam, setShowBeam] = useState(false);

  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];

  useEffect(() => { if (!isConnected) router.push("/"); }, [isConnected, router]);

  const generateFragment = useCallback(
    async (choiceText: string = "") => {
      setState((prev) => ({ ...prev, is_loading: true }));
      const fragmentId = state.fragments.length + 1;
      const currentScene = fragmentId === 1 ? scene.description : state.current_scene;

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scene: currentScene, choice: choiceText, history: state.fragments, fragment_id: fragmentId }),
        });
        if (!response.ok) throw new Error("Error en la generación");
        const data: GenerateResponse = await response.json();

        const act = fragmentId <= 5 ? 1 : fragmentId <= 12 ? 2 : 3;

        setState((prev) => ({
          ...prev,
          fragments: [...prev.fragments, data.fragment],
          current_act: act as 1 | 2 | 3,
          current_scene: data.fragment.text,
          choices: fragmentId >= 15 ? [] : data.choices,
          is_loading: false,
          is_complete: fragmentId >= 15,
        }));

        if (data.fragment.storage_hash) {
          setShowBeam(true);
          setTimeout(() => setShowBeam(false), 1500);
          setToastInfo({ message: `Fragment #${String(fragmentId).padStart(2, "0")} saved`, hash: data.fragment.storage_hash, visible: true });
          setTimeout(() => setToastInfo((t) => ({ ...t, visible: false })), 4000);
        }
      } catch (error) {
        console.error(error);
        setState((prev) => ({ ...prev, is_loading: false }));
      }
    },
    [state.fragments, state.current_scene, scene.description]
  );

  useEffect(() => {
    if (state.fragments.length === 0 && isConnected && loaded) generateFragment();
  }, [isConnected, loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const latestFragment = state.fragments.length > 0 ? state.fragments[state.fragments.length - 1] : null;

  return (
    <div className="min-h-screen bg-black relative cursor-crosshair">
      {!loaded && <LoadingScreen onComplete={() => setLoaded(true)} />}

      {loaded && (
        <>
          <Scene3D />

          {/* Scanlines */}
          <div className="scanlines fixed inset-0 z-[3] pointer-events-none" />

          {/* Vignette */}
          <div className="fixed inset-0 z-[4] pointer-events-none" style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)"
          }} />

          <HUD
            fragmentCount={state.fragments.length}
            currentAct={state.current_act}
            latestFragment={latestFragment}
            fragments={state.fragments}
            onMapNodeClick={(f) => setReviewFragment(f)}
          />

          {/* Center characters */}
          <div className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="flex items-end gap-8">
              <motion.div
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="opacity-80"
              >
                <PixelCharacter type="detective" size={96} />
              </motion.div>

              {state.fragments.length > 0 && state.fragments.length < 15 && (
                <motion.div
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 0.7, x: 0 }}
                  transition={{ duration: 2, delay: 1 }}
                >
                  <PixelCharacter
                    type={state.fragments.length <= 5 ? "witness" : "shadow"}
                    size={96}
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom center: interact prompt */}
          {!state.is_loading && latestFragment && !reviewFragment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30"
            >
              <p className="font-mono text-[11px] text-[#e8d5b0]/40 bg-black/60 border border-[#c4923a]/15 px-4 py-2 backdrop-blur-sm">
                Fragmento #{String(latestFragment.id).padStart(2, "0")} desbloqueado — Haz tu elección
              </p>
            </motion.div>
          )}

          {/* Loading state */}
          <AnimatePresence>
            {state.is_loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm"
              >
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-6">
                    <div className="absolute inset-0 border border-red-900/40 rounded-full animate-ping" />
                    <div className="absolute inset-2 border border-[#c4923a]/30 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
                    <div className="absolute inset-4 border-t border-red-700/60 rounded-full animate-spin" style={{ animationDuration: "1.5s" }} />
                  </div>
                  <motion.p
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="font-mono text-xs text-[#c4923a]/60 tracking-wider"
                  >
                    Accediendo a memoria...
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Fragment modal - latest */}
          <AnimatePresence>
            {latestFragment && !state.is_loading && !reviewFragment && (
              <FragmentModal
                fragment={latestFragment}
                choices={state.choices}
                isNew={latestFragment.id === state.fragments.length}
                isComplete={state.is_complete}
                isLoading={state.is_loading}
                onChoose={(c) => generateFragment(c.text)}
              />
            )}
          </AnimatePresence>

          {/* Fragment modal - review */}
          <AnimatePresence>
            {reviewFragment && (
              <FragmentModal
                fragment={reviewFragment}
                choices={[]}
                isNew={false}
                isComplete={false}
                isLoading={false}
                onChoose={() => {}}
                onClose={() => setReviewFragment(null)}
              />
            )}
          </AnimatePresence>

          <ChainBeam visible={showBeam} />
          <Toast message={toastInfo.message} hash={toastInfo.hash} visible={toastInfo.visible} />
        </>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <GameContent />
    </Suspense>
  );
}
