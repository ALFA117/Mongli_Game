"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import CSSRain from "@/components/CSSRain";
import CSSSkull from "@/components/CSSSkull";
import FogLayer from "@/components/FogLayer";
import FloatingDust from "@/components/FloatingDust";
import CursorGlow from "@/components/CursorGlow";
import GlitchFlash from "@/components/GlitchFlash";
import PixelCharacter from "@/components/PixelCharacter";
import { toggleAmbientAudio } from "@/lib/ambientAudio";
import { INITIAL_SCENES } from "@/lib/types";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [audioOn, setAudioOn] = useState(false);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative", background: "#000" }} className="cursor-crosshair">
      {/* Z0: base gradient */}
      <div className="absolute inset-0" style={{ zIndex: 0, background: "radial-gradient(ellipse at center, #1a0000 0%, #000 60%)" }} />

      {/* Z1: fog + skull */}
      <FogLayer />
      <CSSSkull />
      <CSSRain />

      {/* Z2-5: overlays */}
      <div className="static-noise absolute inset-0" style={{ zIndex: 2 }} />
      <div className="absolute inset-0" style={{ zIndex: 3, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 5px)", animation: "scanline-scroll 8s linear infinite" }} />
      <div className="absolute inset-0" style={{ zIndex: 4, pointerEvents: "none", boxShadow: "inset 0 0 200px #000, inset 0 0 100px rgba(0,0,0,0.8)" }} />
      <FloatingDust />
      <GlitchFlash />
      <CursorGlow />

      {/* Z10: content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4" style={{ zIndex: 10 }}>
        <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2 }}
          className="glitch-title font-[family-name:var(--font-display)] hover-shake mb-3 select-none" data-text="MONGLI">
          MONGLI
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-center mb-2">
          <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-red-800/30 to-transparent mx-auto mb-4" />
          <p className="font-mono text-sm text-red-200/40 max-w-md mx-auto h-10">
            Alguien tomó tus recuerdos. Recupéralos antes de que sea tarde.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="flex items-end gap-5 my-4">
          {(["detective", "witness", "shadow"] as const).map((type, i) => (
            <div key={type} className="flex flex-col items-center">
              <div style={{ animation: `float ${1.8 + i * 0.4}s ease-in-out infinite` }}>
                <PixelCharacter type={type} size={72} />
              </div>
              <div className="char-shadow mt-1" />
            </div>
          ))}
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4 }}
          className="text-[10px] font-mono text-green-500/25 mb-3">
          <span className="text-green-400/40">●</span> 0G Galileo Testnet
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3 }} className="hover-shake">
          <WalletButton />
        </motion.div>

        {isConnected && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="w-full max-w-2xl mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-[1px] bg-red-900/15" />
              <p className="text-[10px] text-red-500/25 font-mono uppercase tracking-[0.3em]">¿ Dónde despertar ?</p>
              <div className="flex-1 h-[1px] bg-red-900/15" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {INITIAL_SCENES.map((sc, i) => (
                <motion.button key={sc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.15 }}
                  onClick={() => router.push(`/game?scene=${sc.id}`)}
                  className="group border border-red-900/10 bg-black/80 p-4 text-left cursor-pointer transition-all duration-500 hover:border-red-700/30 hover:shadow-[0_0_30px_rgba(139,0,0,0.1)] hover-shake relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-full h-0 group-hover:h-full bg-red-950/20 transition-all duration-700" />
                  <h3 className="relative font-[family-name:var(--font-display)] text-base text-red-200/50 mb-1 group-hover:text-red-200/80 transition-colors">{sc.title}</h3>
                  <p className="relative font-mono text-[10px] text-red-200/12 leading-relaxed group-hover:text-red-200/25 transition-colors">{sc.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Audio toggle */}
      <button onClick={() => setAudioOn(toggleAmbientAudio())}
        className="fixed top-4 right-4 border border-red-900/20 bg-black/80 px-3 py-1.5 font-mono text-[10px] text-red-400/40 hover:text-red-400 transition-colors cursor-pointer uppercase tracking-widest"
        style={{ zIndex: 50 }}>
        {audioOn ? "🔊 ON" : "🔇 OFF"}
      </button>

      <p className="absolute bottom-3 left-3 text-[9px] text-red-900/15 font-mono tracking-wider" style={{ zIndex: 10 }}>
        MONGLI v0.4 // Claude AI + 0G Chain
      </p>

      <style jsx>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes scanline-scroll { from{background-position-y:0} to{background-position-y:100px} }
      `}</style>
    </div>
  );
}
