"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import GlitchTitle from "@/components/GlitchTitle";
import Typewriter from "@/components/Typewriter";
import RainEffect from "@/components/RainEffect";
import StaticNoise from "@/components/StaticNoise";
import AmbientAudio from "@/components/AmbientAudio";
import DustParticles from "@/components/DustParticles";
import { INITIAL_SCENES } from "@/lib/types";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const startGame = (sceneId: string) => {
    router.push(`/game?scene=${sceneId}`);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden cursor-crosshair">
      <Skull3D />
      <RainEffect />
      <StaticNoise />
      <DustParticles />

      {/* Vignette */}
      <div className="fixed inset-0 z-[9] pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.8) 100%)"
      }} />

      {/* Scanlines */}
      <div className="scanlines fixed inset-0 z-[9] pointer-events-none" />

      <div className="relative z-20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          className="mb-6 hover-shake"
        >
          <GlitchTitle />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1.5 }}
          className="mb-2 text-center"
        >
          <div className="w-40 h-[1px] bg-gradient-to-r from-transparent via-red-800/40 to-transparent mx-auto mb-6" />
          <Typewriter text="Alguien tomó tus recuerdos. Recupéralos antes de que sea tarde." />
        </motion.div>

        {/* Chain counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 6 }}
          className="mt-4 mb-8"
        >
          <p className="text-[10px] font-mono text-green-500/30 tracking-wider text-center">
            <span className="text-green-400/50">●</span> 0G Chain activa — Galileo Testnet
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4.5, duration: 1 }}
          className="hover-shake"
        >
          <WalletButton />
        </motion.div>

        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-full max-w-2xl mt-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-red-900/20" />
              <p className="text-[10px] text-red-500/30 font-mono uppercase tracking-[0.3em]">
                ¿ Dónde despertar ?
              </p>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-red-900/20" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INITIAL_SCENES.map((scene, i) => (
                <motion.button
                  key={scene.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  onClick={() => startGame(scene.id)}
                  className="scene-card group border border-red-900/15 bg-black p-6 text-left cursor-pointer
                    transition-all duration-500 hover:border-red-700/40
                    hover:shadow-[0_0_30px_rgba(139,0,0,0.15)] hover-shake relative overflow-hidden"
                >
                  <div className="absolute bottom-0 left-0 w-full h-0 group-hover:h-full bg-red-950/15 transition-all duration-700" />
                  <h3 className="relative font-[family-name:var(--font-display)] text-lg text-red-200/60 mb-2 group-hover:text-red-200/90 transition-colors">
                    {scene.title}
                  </h3>
                  <p className="relative font-mono text-[11px] text-red-200/15 leading-relaxed group-hover:text-red-200/30 transition-colors">
                    {scene.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3 }}
        className="fixed bottom-4 left-4 z-50"
      >
        <p className="text-[9px] text-red-900/25 font-mono tracking-wider">
          MONGLI v0.1 // Claude AI + 0G Chain
        </p>
      </motion.div>

      <AmbientAudio />
    </div>
  );
}
