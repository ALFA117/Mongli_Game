"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import GlitchTitle from "@/components/GlitchTitle";
import Typewriter from "@/components/Typewriter";
import StaticNoise from "@/components/StaticNoise";
import AmbientAudio from "@/components/AmbientAudio";
import DustParticles from "@/components/DustParticles";
import PixelCharacter from "@/components/PixelCharacter";
import { INITIAL_SCENES } from "@/lib/types";

const Scene3D = dynamic(() => import("@/components/Scene3D"), { ssr: false });

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden cursor-crosshair">
      <Scene3D />
      <StaticNoise />
      <DustParticles />

      <div className="fixed inset-0 z-[4] pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.9) 100%)"
      }} />
      <div className="scanlines fixed inset-0 z-[5] pointer-events-none" />

      <div className="relative z-20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.5 }}
          className="mb-4 hover-shake"
        >
          <GlitchTitle />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mb-2 text-center"
        >
          <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-red-800/30 to-transparent mx-auto mb-6" />
          <Typewriter text="Alguien tomó tus recuerdos. Recupéralos antes de que sea tarde." />
        </motion.div>

        {/* Pixel characters preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="flex items-end gap-6 my-6"
        >
          <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <PixelCharacter type="detective" size={64} />
          </motion.div>
          <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}>
            <PixelCharacter type="witness" size={64} />
          </motion.div>
          <motion.div animate={{ y: [0, -2, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}>
            <PixelCharacter type="shadow" size={64} />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 5 }}
          className="mt-2 mb-4"
        >
          <p className="text-[10px] font-mono text-green-500/25 tracking-wider text-center">
            <span className="text-green-400/40">●</span> 0G Galileo Testnet — Blockchain activa
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4 }}
          className="hover-shake"
        >
          <WalletButton />
        </motion.div>

        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-2xl mt-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-red-900/15" />
              <p className="text-[10px] text-red-500/25 font-mono uppercase tracking-[0.3em]">¿ Dónde despertar ?</p>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-red-900/15" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INITIAL_SCENES.map((sc, i) => (
                <motion.button
                  key={sc.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  onClick={() => router.push(`/game?scene=${sc.id}`)}
                  className="group border border-red-900/10 bg-black/80 p-5 text-left cursor-pointer
                    transition-all duration-500 hover:border-red-700/30
                    hover:shadow-[0_0_40px_rgba(139,0,0,0.1)] hover-shake relative overflow-hidden backdrop-blur-sm"
                >
                  <div className="absolute bottom-0 left-0 w-full h-0 group-hover:h-full bg-red-950/20 transition-all duration-700" />
                  <h3 className="relative font-[family-name:var(--font-display)] text-lg text-red-200/50 mb-2 group-hover:text-red-200/80 transition-colors">
                    {sc.title}
                  </h3>
                  <p className="relative font-mono text-[10px] text-red-200/12 leading-relaxed group-hover:text-red-200/25 transition-colors">
                    {sc.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="fixed bottom-4 left-4 z-50 text-[9px] text-red-900/20 font-mono tracking-wider"
      >
        MONGLI v0.2 // Claude AI + 0G Chain + Three.js
      </motion.p>

      <AmbientAudio />
    </div>
  );
}
