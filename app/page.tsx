"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import dynamic from "next/dynamic";
import WalletButton from "@/components/WalletButton";
import CSSRain from "@/components/CSSRain";
import FogLayer from "@/components/FogLayer";
import FloatingDust from "@/components/FloatingDust";
import GlitchFlash from "@/components/GlitchFlash";
import BloodCursor from "@/components/BloodCursor";
import PixelSprite from "@/components/PixelSprite";
import { audioEngine } from "@/lib/ambientAudio";
import { t, Lang } from "@/lib/i18n";
import { INITIAL_SCENES } from "@/lib/types";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [audioOn, setAudioOn] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [needsClick, setNeedsClick] = useState(true);
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("mongli-lang") as Lang | null;
    if (saved === "en" || saved === "es") setLang(saved);
  }, []);

  useEffect(() => {
    try {
      audioEngine.start();
      if (audioEngine.isRunning()) {
        setAudioOn(true);
        setNeedsClick(false);
      } else {
        setNeedsClick(true);
      }
    } catch {
      setNeedsClick(true);
    }
  }, []);

  const handleWake = () => {
    audioEngine.start();
    setAudioOn(true);
    setNeedsClick(false);
  };

  const handleLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("mongli-lang", l);
  };

  const L = t[lang];

  if (needsClick) {
    return (
      <div onClick={handleWake} style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <BloodCursor />
        <p style={{ fontFamily: "'Special Elite', serif", fontSize: "clamp(18px, 4vw, 28px)", color: "#8B0000", animation: "pulse-text 2s ease-in-out infinite", letterSpacing: 4, textAlign: "center" }}>
          {L.tapToWake}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#000" }}>
      <BloodCursor />

      {/* Background layers */}
      <div className="absolute inset-0" style={{ zIndex: 0, background: "radial-gradient(ellipse at center, #1a0000 0%, #000 55%)" }} />
      <FogLayer />
      <CSSRain />
      <div className="static-noise absolute inset-0" style={{ zIndex: 2 }} />
      <div className="scanlines absolute inset-0" style={{ zIndex: 3 }} />
      <div className="absolute inset-0" style={{ zIndex: 4, pointerEvents: "none", boxShadow: "inset 0 0 200px #000, inset 0 0 100px rgba(0,0,0,0.8)" }} />
      <FloatingDust />
      <GlitchFlash />

      {/* 3D Skull background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1, opacity: 0.35 }}>
        <div style={{ width: "60vmin", height: "60vmin" }}>
          <Skull3D />
        </div>
      </div>

      {/* HUD top bar */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-2" style={{ zIndex: 50 }}>
        {/* Volume */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { const on = audioEngine.toggle(); setAudioOn(on); }}
            className="font-mono text-[10px] text-red-400/40 hover:text-red-400"
            style={{ background: "none", border: "none", padding: "4px" }}
            aria-label={audioOn ? L.audioOn : L.audioOff}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {audioOn ? (
                <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>
              ) : (
                <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
              )}
            </svg>
          </button>
          {audioOn && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); audioEngine.setVolume(v); }}
              className="volume-slider"
              aria-label="Volume"
            />
          )}
        </div>

        {/* Language toggle */}
        <div className="lang-toggle">
          <button className={lang === "es" ? "active" : ""} onClick={() => handleLang("es")}>ES</button>
          <button className={lang === "en" ? "active" : ""} onClick={() => handleLang("en")}>EN</button>
        </div>
      </div>

      {/* Main content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4" style={{ zIndex: 10 }}>
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2 }}
          className="glitch-title font-[family-name:var(--font-display)] hover-shake mb-3 select-none"
          data-text={L.title}
        >
          {L.title}
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center mb-3">
          <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-red-800/30 to-transparent mx-auto mb-4" />
          <p className="font-mono text-sm text-red-200/35 max-w-md mx-auto">
            {L.subtitle}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="flex items-end gap-6 my-4">
          {(["detective", "witness", "shadow"] as const).map((type, i) => (
            <div key={type} className="flex flex-col items-center">
              <div style={{ animation: `sprite-idle ${1.5 + i * 0.3}s ease-in-out infinite` }}>
                <PixelSprite type={type} size={80} />
              </div>
              <div className="char-shadow mt-1" />
            </div>
          ))}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} className="text-[10px] font-mono text-green-500/25 mb-3">
          <span className="text-green-400/40">●</span> 0G Galileo Testnet
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }} className="hover-shake">
          <WalletButton />
        </motion.div>

        {isConnected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-2xl mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-[1px] bg-red-900/15" />
              <p className="text-[10px] text-red-500/25 font-mono uppercase tracking-[0.3em]">{L.whereToWake}</p>
              <div className="flex-1 h-[1px] bg-red-900/15" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INITIAL_SCENES.map((sc, i) => {
                const sceneKey = sc.id as keyof typeof L.scenes;
                const sceneT = L.scenes[sceneKey];
                return (
                  <motion.button
                    key={sc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    onClick={() => router.push(`/game?scene=${sc.id}&lang=${lang}`)}
                    className="scene-card glass-panel p-4 text-left hover-shake"
                  >
                    <h3 className="relative font-[family-name:var(--font-display)] text-base text-red-200/50 mb-1 z-10 transition-colors">{sceneT?.title || sc.title}</h3>
                    <p className="relative font-mono text-[10px] text-red-200/12 leading-relaxed z-10 transition-colors">{sceneT?.desc || sc.description}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      <p className="absolute bottom-3 left-3 text-[9px] text-red-900/15 font-mono tracking-wider" style={{ zIndex: 10 }}>
        {L.version}
      </p>
    </div>
  );
}
