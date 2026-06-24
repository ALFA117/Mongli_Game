"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount } from "wagmi";
import FragmentCard from "@/components/Fragment";
import ChoicePanel from "@/components/ChoicePanel";
import MemoryMap from "@/components/MemoryMap";
import WalletButton from "@/components/WalletButton";
import {
  Fragment,
  Choice,
  GameState,
  INITIAL_SCENES,
  GenerateResponse,
} from "@/lib/types";

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

  const [showMap, setShowMap] = useState(false);
  const [selectedFragment, setSelectedFragment] = useState<Fragment | null>(
    null
  );

  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  const generateFragment = useCallback(
    async (choiceText: string = "") => {
      setState((prev) => ({ ...prev, is_loading: true }));

      const fragmentId = state.fragments.length + 1;
      const currentScene =
        fragmentId === 1 ? scene.description : state.current_scene;

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

  const latestFragment =
    state.fragments.length > 0
      ? state.fragments[state.fragments.length - 1]
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-xl text-[#c4923a]">
            MONGLI
          </h1>
          <span className="text-[10px] font-mono text-[#e8d5b0]/30 uppercase">
            Acto {state.current_act} — Fragmento{" "}
            {state.fragments.length}/15
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowMap(!showMap)}
            className="text-xs font-mono text-[#c4923a]/50 hover:text-[#c4923a] transition-colors uppercase"
          >
            {showMap ? "Volver" : "Mapa"}
          </button>
          <WalletButton />
        </div>
      </header>

      <div className="w-full max-w-2xl mx-auto h-1 bg-[#2a2a2a] mt-0">
        <motion.div
          className="h-full bg-[#c4923a]/50"
          initial={{ width: 0 }}
          animate={{
            width: `${(state.fragments.length / 15) * 100}%`,
          }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <main className="flex-1 flex flex-col justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {showMap ? (
            <motion.div
              key="map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-center text-xs text-[#c4923a]/40 font-mono uppercase tracking-widest mb-6">
                Mapa de recuerdos
              </p>
              <MemoryMap
                fragments={state.fragments}
                onSelect={(f) => {
                  setSelectedFragment(f);
                  setShowMap(false);
                }}
              />
            </motion.div>
          ) : selectedFragment ? (
            <motion.div
              key={`selected-${selectedFragment.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FragmentCard fragment={selectedFragment} />
              <div className="text-center mt-6">
                <button
                  onClick={() => setSelectedFragment(null)}
                  className="text-xs font-mono text-[#c4923a]/50 hover:text-[#c4923a] transition-colors"
                >
                  ← Volver al presente
                </button>
              </div>
            </motion.div>
          ) : state.is_loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="inline-block w-8 h-8 border border-[#c4923a]/30 border-t-[#c4923a] rounded-full animate-spin mb-4" />
              <p className="text-xs font-mono text-[#e8d5b0]/30 animate-pulse">
                Recuperando memoria...
              </p>
            </motion.div>
          ) : latestFragment ? (
            <motion.div
              key={`fragment-${latestFragment.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FragmentCard
                fragment={latestFragment}
                isNew={
                  latestFragment.id === state.fragments.length
                }
              />

              {state.is_complete ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="text-center mt-8"
                >
                  <p className="font-[family-name:var(--font-display)] text-xl text-[#c4923a] mb-2">
                    Ahora sabes quién eres.
                  </p>
                  <p className="text-xs font-mono text-[#e8d5b0]/30">
                    {state.fragments.length} fragmentos grabados en 0G
                    Chain
                  </p>
                  <button
                    onClick={() => setShowMap(true)}
                    className="mt-4 text-xs font-mono text-[#c4923a]/50 hover:text-[#c4923a] border border-[#c4923a]/30 px-4 py-2 transition-all hover:border-[#c4923a]"
                  >
                    Ver todos tus recuerdos
                  </button>
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
      </main>

      {latestFragment && latestFragment.storage_hash && !state.is_loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 left-4 bg-[#111111] border border-[#c4923a]/20 px-3 py-2 text-[10px] font-mono text-[#c4923a]/40"
        >
          Fragmento grabado en cadena ✓{" "}
          {latestFragment.storage_hash.slice(0, 10)}...
        </motion.div>
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="inline-block w-8 h-8 border border-[#c4923a]/30 border-t-[#c4923a] rounded-full animate-spin" />
        </div>
      }
    >
      <GameContent />
    </Suspense>
  );
}
