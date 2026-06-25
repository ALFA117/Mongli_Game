"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import GlitchText from "@/components/GlitchText";
import LoadingScreen from "@/components/LoadingScreen";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import AudioToggle from "@/components/AudioToggle";
import { INITIAL_SCENES } from "@/lib/types";
import { initAudio, playChoice, startAudioOnFirstInteraction } from "@/lib/audio";
import { useKeyboardNav } from "@/lib/useKeyboardNav";
import { useRouter } from "next/navigation";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

function LandingContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const [showScenes, setShowScenes] = useState(false);
  const [titleRevealed, setTitleRevealed] = useState(false);
  const [hoveredScene, setHoveredScene] = useState<string | null>(null);
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);

  useKeyboardNav({
    onLeft: () => setSelectedSceneIdx((p) => Math.max(0, p - 1)),
    onRight: () => setSelectedSceneIdx((p) => Math.min(INITIAL_SCENES.length - 1, p + 1)),
    onEnter: () => {
      if (showScenes) {
        handleSceneSelect(INITIAL_SCENES[selectedSceneIdx].id);
      } else if (titleRevealed) {
        setShowScenes(true);
      }
    },
    enabled: !loading,
  });

  const startAudio = useCallback(() => {
    if (!audioStarted) {
      startAudioOnFirstInteraction();
      setAudioStarted(true);
    }
  }, [audioStarted]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setTitleRevealed(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleSceneSelect = (sceneId: string) => {
    playChoice();
    router.push(`/game?scene=${sceneId}`);
  };

  if (loading) {
    return <LoadingScreen onComplete={() => setLoading(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative" onClick={startAudio}>
      <Cursor />
      <ScanlineOverlay />
      <AudioToggle />

      {/* Header */}
      <header className="flex items-center justify-between p-4 sm:p-6 relative z-50">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <span className="font-display text-xs text-noir-muted tracking-[0.3em] uppercase">
            Zero Cup 2026
          </span>
          <span className="w-1 h-1 bg-noir-accent/50 rounded-full" />
          <span className="font-body text-[10px] text-noir-muted/50">0G Labs</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <WalletButton />
        </motion.div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center relative -mt-4 sm:-mt-10 px-4 sm:px-0">
        {/* 3D Skull */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[380px] md:h-[380px] lg:w-[420px] lg:h-[420px] relative"
        >
          <Skull3D className="w-full h-full" scene="hotel" />
          <div className="absolute inset-0 -z-10 bg-noir-accent/5 rounded-full blur-[80px] scale-[2]" />
        </motion.div>

        {/* Title */}
        <AnimatePresence>
          {titleRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="text-center mt-2"
            >
              <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl text-noir-text text-shadow-noir tracking-[0.15em]">
                <GlitchText text="MONGLI" intensity="low" />
              </h1>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.8, duration: 1.5 }}
                className="h-[1px] bg-gradient-to-r from-transparent via-noir-accent/50 to-transparent mx-auto mt-3 max-w-[200px]"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 1.2 }}
                className="font-body text-noir-muted text-[10px] tracking-[0.5em] uppercase mt-4"
              >
                Tus recuerdos son tuyos. Nadie puede borrarlos.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enter button */}
        <AnimatePresence>
          {!showScenes && titleRevealed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 2 }}
              onClick={() => setShowScenes(true)}
              className="mt-12 group relative"
            >
              <span className="px-10 py-3.5 border-2 border-noir-accent bg-noir-accent/15 text-noir-accent font-display text-sm tracking-[0.2em] block transition-all duration-500 group-hover:bg-noir-accent/25 group-hover:border-noir-accent">
                Despertar
              </span>
              <motion.span
                className="absolute -bottom-1 left-0 right-0 h-[1px] bg-noir-accent/30"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scene selection */}
        <AnimatePresence>
          {showScenes && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mt-10 w-full max-w-3xl px-6"
            >
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 0.3 }}
                className="text-center font-display text-noir-muted text-xs mb-8 tracking-[0.3em]"
              >
                ¿Dónde despertaste?
              </motion.p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INITIAL_SCENES.map((scene, i) => (
                  <motion.button
                    key={scene.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.2, duration: 0.6 }}
                    onClick={() => handleSceneSelect(scene.id)}
                    onMouseEnter={() => setHoveredScene(scene.id)}
                    onMouseLeave={() => setHoveredScene(null)}
                    whileHover={{ y: -5 }}
                    whileTap={{ scale: 0.97 }}
                    className={`p-4 sm:p-6 bg-noir-card border-2 text-left transition-all duration-500 group relative overflow-hidden uxpm-press uxpm-tap-highlight ${
                      selectedSceneIdx === i && showScenes
                        ? "border-noir-accent ring-2 ring-noir-accent/40 shadow-[0_0_20px_rgba(212,162,68,0.2)]"
                        : "border-noir-border hover:border-noir-accent/70 hover:shadow-[0_0_15px_rgba(212,162,68,0.15)]"
                    }`}
                  >
                    {/* Background glow on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-noir-accent/8 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredScene === scene.id ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                    />

                    {/* Corner decoration */}
                    <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-noir-border group-hover:border-noir-accent/30 transition-colors" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-noir-border group-hover:border-noir-accent/30 transition-colors" />

                    <div className="relative z-10">
                      <span className="text-2xl mb-4 block filter grayscale group-hover:grayscale-0 transition-all duration-500">
                        {scene.icon}
                      </span>
                      <h3 className="font-display text-noir-text text-sm sm:text-base mb-2 tracking-wider group-hover:text-noir-accent transition-colors duration-300">
                        {scene.title}
                      </h3>
                      <p className="font-body text-noir-text/60 text-xs leading-relaxed">
                        {scene.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1 }}
                className="text-center font-body text-[9px] text-noir-muted mt-6 tracking-wider"
              >
                Cada escena genera una historia única con IA
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 2.5 }}
          className="space-y-1"
        >
          <p className="font-body text-[9px] text-noir-muted tracking-[0.2em]">
            Powered by 0G Labs &middot; AI by Claude &middot; Built for Zero Cup 2026
          </p>
          <p className="font-body text-[8px] text-noir-muted/50">
            Recuerdos almacenados en 0G Storage &middot; Verificados en 0G Chain
          </p>
          {!audioStarted && (
            <motion.p
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="font-body text-[9px] text-noir-accent/50 mt-2 tracking-wider"
            >
              [ click en cualquier lugar para activar el audio ]
            </motion.p>
          )}
        </motion.div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <LandingContent />
    </Providers>
  );
}
