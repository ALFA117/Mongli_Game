"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import FragmentCard from "@/components/Fragment";
import ChoicePanel from "@/components/ChoicePanel";
import MemoryMap from "@/components/MemoryMap";
import WalletButton from "@/components/WalletButton";
import LoadingSequence from "@/components/LoadingSequence";
import Toast from "@/components/Toast";
import DustParticles from "@/components/DustParticles";
import {
  Fragment,
  Choice,
  GameState,
  INITIAL_SCENES,
  GenerateResponse,
} from "@/lib/types";

const ACT_NAMES: Record<number, string> = {
  1: "LA AMNESIA",
  2: "EL DESDOBLAMIENTO",
  3: "LA REVELACIÓN",
};

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected, address } = useAccount();
  const sceneId = searchParams.get("scene") || "alley";

  const [state, setState] = useState<GameState>({
    fragments: [],
    current_act: 1,
    current_scene: "",
    choices: [],
    is_loading: false,
    is_complete: false,
  });

  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(null);
  const [toastInfo, setToastInfo] = useState({ message: "", hash: "", visible: false });
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  const generateFragment = useCallback(
    async (choiceText: string = "") => {
      setState((prev) => ({ ...prev, is_loading: true }));
      const fragmentId = state.fragments.length + 1;
      const currentScene = fragmentId === 1 ? scene.description : state.current_scene;

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene: currentScene,
            choice: choiceText,
            history: state.fragments,
            fragment_id: fragmentId,
          }),
        });

        if (!response.ok) throw new Error("Error en la generación");
        const data: GenerateResponse = await response.json();

        const act = fragmentId <= 5 ? 1 : fragmentId <= 12 ? 2 : 3;
        const isComplete = fragmentId >= 15;

        setState((prev) => ({
          ...prev,
          fragments: [...prev.fragments, data.fragment],
          current_act: act as 1 | 2 | 3,
          current_scene: data.fragment.text,
          choices: isComplete ? [] : data.choices,
          is_loading: false,
          is_complete: isComplete,
        }));

        if (data.fragment.storage_hash) {
          setToastInfo({
            message: `Fragment #${String(fragmentId).padStart(2, "0")} saved`,
            hash: data.fragment.storage_hash,
            visible: true,
          });
          setTimeout(() => setToastInfo((t) => ({ ...t, visible: false })), 4000);
        }
      } catch (error) {
        console.error("Error:", error);
        setState((prev) => ({ ...prev, is_loading: false }));
      }
    },
    [state.fragments, state.current_scene, scene.description]
  );

  useEffect(() => {
    if (state.fragments.length === 0 && isConnected) {
      generateFragment();
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = (choice: Choice) => {
    generateFragment(choice.text);
  };

  const latestFragment = state.fragments.length > 0
    ? state.fragments[state.fragments.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-black flex flex-col relative cursor-crosshair">
      <DustParticles />

      {/* Vignette */}
      <div className="fixed inset-0 z-[2] pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)"
      }} />

      {/* Scanlines */}
      <div className="scanlines fixed inset-0 z-[2] pointer-events-none" />

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-red-900/15 bg-black/90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <h1
            className="font-[family-name:var(--font-display)] text-lg text-red-700/80 cursor-pointer hover-shake"
            onClick={() => router.push("/")}
          >
            MONGLI
          </h1>
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
            <span className="text-red-500/40 uppercase tracking-widest">
              Acto {state.current_act} — {ACT_NAMES[state.current_act]}
            </span>
            <span className="text-[#2a2a2a]">|</span>
            <span className="text-[#c4923a]/40">
              Fragmento {String(state.fragments.length).padStart(2, "0")} / 15
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMapOpen(!mobileMapOpen)}
            className="sm:hidden text-[10px] font-mono text-red-500/40 border border-red-900/20 px-2 py-1 hover:text-red-400 transition-colors cursor-pointer"
          >
            MAPA
          </button>
          <WalletButton />
        </div>
      </header>

      {/* Progress bar */}
      <div className="relative z-30 w-full h-[2px] bg-[#0a0a0a]">
        <motion.div
          className="h-full bg-gradient-to-r from-red-900 to-[#c4923a]"
          initial={{ width: 0 }}
          animate={{ width: `${(state.fragments.length / 15) * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* Mobile info bar */}
      <div className="sm:hidden relative z-30 flex items-center justify-center gap-3 py-2 border-b border-[#1a1a1a] text-[10px] font-mono">
        <span className="text-red-500/40 uppercase">Acto {state.current_act}</span>
        <span className="text-[#2a2a2a]">|</span>
        <span className="text-[#c4923a]/40">#{String(state.fragments.length).padStart(2, "0")}/15</span>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col sm:flex-row relative z-10">
        {/* LEFT: Memory Map */}
        <aside className={`${mobileMapOpen ? "block" : "hidden"} sm:block sm:w-[35%] lg:w-[30%] border-r border-red-900/10 p-4 sm:p-6 overflow-y-auto bg-black/50`}>
          <p className="text-[9px] font-mono text-red-500/30 uppercase tracking-[0.2em] mb-4 text-center">
            Mapa de recuerdos
          </p>
          <MemoryMap
            fragments={state.fragments}
            activeId={state.fragments.length}
            onSelect={(f) => {
              setSelectedFragment(f);
              setMobileMapOpen(false);
            }}
          />

          {/* Fragment list under map */}
          <div className="mt-6 space-y-2">
            {state.fragments.slice().reverse().map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFragment(f)}
                className={`w-full text-left p-2 border font-mono text-[10px] transition-all cursor-pointer hover-shake
                  ${f.id === state.fragments.length
                    ? "border-red-900/30 text-red-200/50"
                    : "border-[#1a1a1a] text-[#e8d5b0]/20 hover:border-[#c4923a]/30"
                  }`}
              >
                <span className="text-[#c4923a]/40">#{String(f.id).padStart(2, "0")}</span>{" "}
                {f.text.slice(0, 50)}...
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT: Active fragment */}
        <section className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {selectedFragment && selectedFragment.id !== state.fragments.length ? (
              <motion.div
                key={`review-${selectedFragment.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-lg mx-auto w-full"
              >
                <FragmentCard fragment={selectedFragment} />
                <button
                  onClick={() => setSelectedFragment(null)}
                  className="mt-4 text-xs font-mono text-red-500/40 hover:text-red-400 transition-colors block mx-auto cursor-pointer"
                >
                  ← Volver al presente
                </button>
              </motion.div>
            ) : state.is_loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSequence />
              </motion.div>
            ) : latestFragment ? (
              <motion.div
                key={`fragment-${latestFragment.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-lg mx-auto w-full"
              >
                <FragmentCard
                  fragment={latestFragment}
                  isNew={latestFragment.id === state.fragments.length}
                />

                {state.is_complete ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 }}
                    className="text-center mt-8"
                  >
                    <p className="font-[family-name:var(--font-display)] text-2xl text-red-600/80 mb-2">
                      Ahora sabes quién eres.
                    </p>
                    <p className="text-xs font-mono text-[#c4923a]/30">
                      {state.fragments.length} fragmentos grabados en 0G Chain
                    </p>
                  </motion.div>
                ) : (
                  <ChoicePanel
                    choices={state.choices}
                    onChoose={handleChoice}
                    disabled={state.is_loading}
                  />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      </main>

      <Toast
        message={toastInfo.message}
        hash={toastInfo.hash}
        visible={toastInfo.visible}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="inline-block w-8 h-8 border border-red-900/30 border-t-red-700 rounded-full animate-spin" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
