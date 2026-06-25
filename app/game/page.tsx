"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import FragmentComponent from "@/components/Fragment";
import ChoicePanel from "@/components/ChoicePanel";
import MemoryMap from "@/components/MemoryMap";
import Toast from "@/components/Toast";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import AudioToggle from "@/components/AudioToggle";
import GlitchText from "@/components/GlitchText";
import FragmentTimeline from "@/components/FragmentTimeline";
import PlayerStats from "@/components/PlayerStats";
import Revelation from "@/components/Revelation";
import FragmentViewer from "@/components/FragmentViewer";
import Achievements, { ACHIEVEMENTS } from "@/components/Achievements";
import type { AchievementMeta } from "@/components/Achievements";
import AchievementNotification from "@/components/AchievementNotification";
import type { AchievementNotifItem } from "@/components/AchievementNotification";
import MobileNav from "@/components/MobileNav";
import { initAudio, playChainConfirm, playChoice, playAchievementSound, playDiscovery, setAct, startAudioOnFirstInteraction } from "@/lib/audio";
import { useKeyboardNav } from "@/lib/useKeyboardNav";
import { useChainWrite } from "@/lib/useChainWrite";
import { INITIAL_SCENES } from "@/lib/types";
import type { Fragment, Choice, GenerateResponse } from "@/lib/types";

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sceneId = searchParams.get("scene") || "hotel";
  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];

  const chainWrite = useChainWrite();
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [currentFragment, setCurrentFragment] = useState<Fragment | null>(null);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fragmentRevealed, setFragmentRevealed] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showRevelation, setShowRevelation] = useState(false);
  const [viewingFragment, setViewingFragment] = useState<Fragment | null>(null);
  const [toast, setToast] = useState<{ message: string; hash?: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [focusedChoiceIdx, setFocusedChoiceIdx] = useState(0);
  const [newlyUnlockedId, setNewlyUnlockedId] = useState<number | undefined>();

  // Achievement system
  const [notifQueue, setNotifQueue] = useState<AchievementNotifItem[]>([]);
  const [achievementMeta, setAchievementMeta] = useState<AchievementMeta>({
    fragmentViewCounts: {},
    txLinkClicked: false,
    pointOfNoReturnTriggered: false,
  });
  const checkedAchievements = useRef(new Set<string>());

  const anyModalOpen = showMap || showStats || showAchievements || showRevelation || !!viewingFragment;

  // Track fragment views for "Eco Del Pasado" achievement
  const handleViewFragment = useCallback((frag: Fragment) => {
    setViewingFragment(frag);
    setAchievementMeta((prev) => ({
      ...prev,
      fragmentViewCounts: {
        ...prev.fragmentViewCounts,
        [frag.id]: (prev.fragmentViewCounts[frag.id] || 0) + 1,
      },
    }));
  }, []);

  // Track TX link clicks for "La Cadena No Miente" achievement
  const handleTxLinkClick = useCallback(() => {
    setAchievementMeta((prev) => ({ ...prev, txLinkClicked: true }));
  }, []);

  // Keyboard navigation
  useKeyboardNav({
    onLeft: () => {
      if (!anyModalOpen && fragmentRevealed && choices.length > 0) {
        setFocusedChoiceIdx(0);
      } else if (!anyModalOpen && currentFragment && currentFragment.id > 1) {
        const prev = fragments.find((f) => f.id === currentFragment.id - 1);
        if (prev) handleViewFragment(prev);
      }
    },
    onRight: () => {
      if (!anyModalOpen && fragmentRevealed && choices.length > 0) {
        setFocusedChoiceIdx(Math.min(1, choices.length - 1));
      }
    },
    onEnter: () => {
      if (!anyModalOpen && fragmentRevealed && choices.length > 0) {
        handleChoice(choices[focusedChoiceIdx]);
      }
    },
    onEscape: () => {
      if (showMap) setShowMap(false);
      else if (showStats) setShowStats(false);
      else if (showAchievements) setShowAchievements(false);
      else if (viewingFragment) setViewingFragment(null);
    },
    enabled: !isGenerating,
  });

  useEffect(() => {
    initAudio();
    // Audio starts on first user interaction (browser autoplay policy)
    const start = () => startAudioOnFirstInteraction();
    document.addEventListener("click", start, { once: true });
    document.addEventListener("touchstart", start, { once: true });
    return () => {
      document.removeEventListener("click", start);
      document.removeEventListener("touchstart", start);
    };
  }, []);

  // Check all achievements whenever state changes
  useEffect(() => {
    for (const ach of ACHIEVEMENTS) {
      if (checkedAchievements.current.has(ach.id)) continue;
      if (ach.check(fragments, achievementMeta)) {
        checkedAchievements.current.add(ach.id);
        const notifItem: AchievementNotifItem = {
          id: ach.id,
          title: ach.title,
          asciiIcon: ach.asciiIcon,
          category: ach.category,
        };
        setTimeout(() => {
          playAchievementSound(ach.category);
          setNotifQueue((prev) => [...prev, notifItem]);
        }, 1200);
      }
    }
  }, [fragments, achievementMeta]);

  // Trigger revelation at fragment 15
  useEffect(() => {
    if (fragments.length >= 15 && !showRevelation) {
      setTimeout(() => setShowRevelation(true), 3000);
    }
  }, [fragments.length, showRevelation]);

  const generateFragment = useCallback(
    async (choiceText: string = "") => {
      setIsGenerating(true);
      setFragmentRevealed(false);
      setChoices([]);
      setError(null);

      // Track point-of-no-return choices
      const currentChoices = choices;
      const chosenChoice = currentChoices.find((c) => c.text === choiceText);
      if (chosenChoice?.isPointOfNoReturn) {
        setAchievementMeta((prev) => ({ ...prev, pointOfNoReturnTriggered: true }));
      }

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene: scene.description,
            history: fragments,
            choice: choiceText,
            fragmentId: fragments.length + 1,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.error || "Error generando fragmento");
        }

        const data: GenerateResponse = await response.json();

        setCurrentFragment(data.fragment);
        setFragments((prev) => [...prev, data.fragment]);
        setChoices(data.choices);
        setNewlyUnlockedId(data.fragment.id);
        playDiscovery();

        if (data.fragment.toneScore >= 7) {
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 500);
        }

        // Sign on-chain with MetaMask if wallet connected
        if (chainWrite.isConnected && chainWrite.hasContract && data.storageHash) {
          const onChainTx = await chainWrite.saveFragment(data.storageHash, data.fragment.id);
          if (onChainTx) {
            data.fragment.txHash = onChainTx;
            setFragments((prev) =>
              prev.map((f) => (f.id === data.fragment.id ? { ...f, txHash: onChainTx } : f))
            );
          }
        }

        playChainConfirm();
        setToast({
          message: chainWrite.isConnected
            ? "Fragmento firmado y grabado en cadena"
            : "Fragmento grabado (conecta wallet para firmar on-chain)",
          hash: data.fragment.txHash || data.storageHash,
          visible: true,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        setError(msg);
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    },
    [fragments, scene, choices]
  );

  useEffect(() => {
    if (fragments.length === 0 && !isGenerating) {
      generateFragment();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoice = (choice: Choice) => {
    playChoice();
    generateFragment(choice.text);
  };

  const handleMapSelect = (id: number) => {
    const frag = fragments.find((f) => f.id === id);
    if (frag) handleViewFragment(frag);
  };

  const handleTimelineSelect = (id: number) => {
    const frag = fragments.find((f) => f.id === id);
    if (frag) handleViewFragment(frag);
  };

  const handleDismissNotif = useCallback((id: string) => {
    setNotifQueue((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const act: 1 | 2 | 3 = fragments.length <= 5 ? 1 : fragments.length <= 12 ? 2 : 3;

  // Sync audio drone with act
  useEffect(() => {
    setAct(showRevelation ? "revelation" : act);
  }, [act, showRevelation]);
  const actLabels = ["Identidad Desconocida", "Dos Caminos", "La Revelación"];
  const actColors = [
    "border-noir-accent/60 text-noir-accent",
    "border-red-800/60 text-red-400",
    "border-purple-800/60 text-purple-400",
  ];
  const progressPercent = (fragments.length / 15) * 100;
  const unlockedAchCount = ACHIEVEMENTS.filter((a) =>
    a.check(fragments, achievementMeta)
  ).length;

  return (
    <motion.div
      className="min-h-screen flex flex-col relative"
      animate={screenShake ? { x: [0, -4, 4, -3, 3, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <Cursor />
      <ScanlineOverlay />
      <AudioToggle />

      <FragmentTimeline
        fragments={fragments}
        currentId={currentFragment?.id || 0}
        onSelect={handleTimelineSelect}
      />

      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-noir-border/20 relative z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <motion.button
            onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }}
            className="font-display text-base sm:text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent transition-colors"
          >
            <GlitchText text="MONGLI" intensity="low" />
          </motion.button>

          <div className="hidden sm:flex items-center gap-3 text-[10px] font-body text-noir-muted">
            <span className={`px-2 py-0.5 border ${actColors[act - 1]}`}>
              Acto {act}: {actLabels[act - 1]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Achievement counter */}
          <motion.button
            onClick={() => setShowAchievements(true)}
            whileHover={{ scale: 1.05 }}
            className="px-2.5 sm:px-3 py-1.5 text-[10px] font-body border border-noir-border/80 text-noir-text/70 hover:border-noir-accent hover:text-noir-accent transition-colors uxpm-press flex items-center gap-1"
            title="Logros"
          >
            <span className="font-mono text-noir-accent">{unlockedAchCount}</span>
            <span className="text-noir-muted/50">/</span>
            <span className="text-noir-muted/50">{ACHIEVEMENTS.length}</span>
            <span className="ml-0.5 text-[9px]">◈</span>
          </motion.button>
          <motion.button
            onClick={() => setShowStats(true)}
            whileHover={{ scale: 1.05 }}
            className="px-2.5 sm:px-3 py-1.5 text-[10px] font-body border border-noir-border/80 text-noir-text/70 hover:border-noir-accent hover:text-noir-accent transition-colors uxpm-press hidden sm:block"
          >
            Perfil
          </motion.button>
          <motion.button
            onClick={() => setShowMap(!showMap)}
            whileHover={{ scale: 1.05 }}
            className={`px-2 sm:px-3 py-1.5 text-[10px] font-body border transition-colors uxpm-press ${
              showMap
                ? "border-noir-accent bg-noir-accent/20 text-noir-accent"
                : "border-noir-border text-noir-muted hover:border-noir-accent/50"
            }`}
          >
            Mapa
          </motion.button>
          <WalletButton />
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-[2px] bg-noir-border/20 relative">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-noir-accent via-noir-accent to-noir-accent/30"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-0 h-full bg-noir-accent/50 blur-sm"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative min-h-[60vh] sm:min-h-[70vh]">
        <AnimatePresence mode="wait">
          {showMap ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl"
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="font-display text-sm text-noir-accent tracking-[0.2em]">
                  Mapa de Recuerdos
                </h2>
                <span className="font-body text-[10px] text-noir-muted">
                  {fragments.length} de 15
                </span>
              </div>
              <div className="h-[350px] sm:h-[450px] border border-noir-border/30 bg-noir-card/30 p-2 sm:p-4 relative">
                <MemoryMap
                  fragments={fragments}
                  currentId={currentFragment?.id || 0}
                  onSelect={handleMapSelect}
                  newlyUnlockedId={newlyUnlockedId}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="fragment"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-lg"
            >
              {/* Scene label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                className="text-center mb-6 sm:mb-8"
              >
                <span className="font-body text-[9px] text-noir-muted tracking-[0.4em] uppercase">
                  {scene.icon} {scene.title}
                </span>
              </motion.div>

              {/* Loading state */}
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16"
                >
                  <div className="inline-flex flex-col items-center gap-6">
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border border-noir-accent/30 rounded-full"
                      />
                      <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border border-noir-accent/50 border-t-noir-accent rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-5 bg-noir-accent/20 rounded-full"
                      />
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="font-display text-xs text-noir-muted tracking-wider animate-flicker">
                        Recuperando recuerdo #{fragments.length + 1}...
                      </p>
                      <p className="font-body text-[9px] text-noir-muted/40">
                        Claude genera &middot; 0G almacena &middot; Chain verifica
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Error state */}
              {error && !isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 sm:py-16"
                >
                  <div className="inline-flex flex-col items-center gap-4 max-w-xs">
                    <div className="w-12 h-12 border border-red-800/50 rounded-full flex items-center justify-center">
                      <span className="text-red-400 text-lg">!</span>
                    </div>
                    <p className="font-body text-red-400/80 text-xs leading-relaxed">{error}</p>
                    <motion.button
                      onClick={() => generateFragment()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2 border border-noir-accent/50 text-noir-accent text-xs font-display tracking-wider hover:bg-noir-accent/10 transition-colors uxpm-press"
                    >
                      Reintentar
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Fragment display */}
              {currentFragment && !isGenerating && !error && (
                <>
                  <FragmentComponent
                    fragment={currentFragment}
                    onComplete={() => setFragmentRevealed(true)}
                  />

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: fragmentRevealed ? 0.3 : 0 }}
                    className="text-center mt-3"
                  >
                    <span className="font-body text-[9px] text-noir-muted tracking-[0.3em]">
                      {currentFragment.id} / 15
                    </span>
                  </motion.div>

                  <AnimatePresence>
                    {fragmentRevealed && choices.length > 0 && fragments.length < 15 && (
                      <ChoicePanel choices={choices} onChoose={handleChoice} disabled={isGenerating} />
                    )}
                  </AnimatePresence>

                  {fragmentRevealed && fragments.length >= 15 && !showRevelation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center mt-8 sm:mt-10"
                    >
                      <p className="font-body text-[10px] text-noir-muted mb-4">
                        15 fragmentos recopilados. La verdad espera.
                      </p>
                      <motion.button
                        onClick={() => setShowRevelation(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 border border-purple-700/60 text-purple-400 font-display text-sm tracking-[0.2em] hover:bg-purple-900/20 transition-colors uxpm-press"
                        animate={{
                          boxShadow: [
                            "0 0 5px rgba(147,51,234,0.2)",
                            "0 0 20px rgba(147,51,234,0.4)",
                            "0 0 5px rgba(147,51,234,0.2)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Revelar la verdad
                      </motion.button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      <PlayerStats
        fragments={fragments}
        achievementMeta={achievementMeta}
        visible={showStats}
        onClose={() => setShowStats(false)}
      />
      <Achievements
        fragments={fragments}
        meta={achievementMeta}
        visible={showAchievements}
        onClose={() => setShowAchievements(false)}
      />
      <Revelation
        fragments={fragments}
        achievementMeta={achievementMeta}
        visible={showRevelation}
        onClose={() => {
          setShowRevelation(false);
          router.push("/");
        }}
      />
      <FragmentViewer
        fragment={viewingFragment}
        allFragments={fragments}
        visible={!!viewingFragment}
        onClose={() => setViewingFragment(null)}
        onNavigate={(id) => {
          const frag = fragments.find((f) => f.id === id);
          if (frag) handleViewFragment(frag);
        }}
        onTxLinkClick={handleTxLinkClick}
      />
      <Toast
        message={toast.message}
        hash={toast.hash}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
      <AchievementNotification
        queue={notifQueue}
        onDismiss={handleDismissNotif}
        onClickNotif={() => {
          setNotifQueue([]);
          setShowAchievements(true);
        }}
      />

      {/* Mobile navigation */}
      <MobileNav
        onLeft={() => {
          if (currentFragment && currentFragment.id > 1) {
            const prev = fragments.find((f) => f.id === currentFragment.id - 1);
            if (prev) handleViewFragment(prev);
          }
        }}
        onRight={() => {
          if (currentFragment && currentFragment.id < fragments.length) {
            const next = fragments.find((f) => f.id === currentFragment.id + 1);
            if (next) handleViewFragment(next);
          }
        }}
        leftDisabled={!currentFragment || currentFragment.id <= 1}
        rightDisabled={!currentFragment || currentFragment.id >= fragments.length}
        visible={fragments.length > 1 && !anyModalOpen && !isGenerating}
      />

      {/* Footer */}
      <footer className="p-3 border-t border-noir-border/10 uxpm-safe-bottom">
        <div className="flex items-center justify-between text-[9px] font-body text-noir-muted/40">
          <span>
            {scene.icon} {scene.title}
          </span>
          <div className="flex items-center gap-3">
            {/* Mobile-only stats and about buttons */}
            <button
              onClick={() => setShowStats(true)}
              className="sm:hidden hover:text-noir-accent transition-colors"
            >
              Perfil
            </button>
            <button
              onClick={() => router.push("/about")}
              className="hover:text-noir-accent transition-colors"
            >
              Sobre Mongli
            </button>
            <span className="hidden sm:inline">
              Acto {act} &middot; {fragments.length} fragmentos
              {chainWrite.isConnected && " · wallet ✓"}
              {chainWrite.isWriting && " · firmando..."}
            </span>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

export default function GamePage() {
  return (
    <Providers>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-noir-bg">
            <motion.p
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-display text-noir-muted text-sm tracking-wider"
            >
              Cargando...
            </motion.p>
          </div>
        }
      >
        <GameContent />
      </Suspense>
    </Providers>
  );
}
