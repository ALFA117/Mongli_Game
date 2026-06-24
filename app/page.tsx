"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import GlitchTitle from "@/components/GlitchTitle";
import Typewriter from "@/components/Typewriter";
import RainEffect from "@/components/RainEffect";
import StaticNoise from "@/components/StaticNoise";
import AmbientAudio from "@/components/AmbientAudio";
import { INITIAL_SCENES } from "@/lib/types";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const startGame = (sceneId: string) => {
    router.push(`/game?scene=${sceneId}`);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <RainEffect />
      <StaticNoise />

      <div className="absolute inset-0 bg-gradient-radial from-red-950/10 via-black to-black z-[1]" />

      <div className="relative z-20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="mb-8 hover-shake"
        >
          <GlitchTitle />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1.5 }}
          className="mb-4"
        >
          <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-red-800/50 to-transparent mx-auto mb-6" />
          <Typewriter text="Alguien tomó tus recuerdos. Recupéralos antes de que sea tarde." />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 5, duration: 1 }}
          className="mt-8 hover-shake"
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
            <p className="text-center text-[10px] text-red-500/30 font-mono uppercase tracking-[0.3em] mb-6">
              ¿ Dónde despertar ?
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {INITIAL_SCENES.map((scene, i) => (
                <motion.button
                  key={scene.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.2 }}
                  onClick={() => startGame(scene.id)}
                  className="scene-card border border-red-900/20 bg-black/80 p-6 text-left cursor-pointer
                    transition-all duration-300 hover:border-red-700/50 hover:bg-red-950/10
                    hover:shadow-[0_0_20px_rgba(120,0,0,0.2)] hover-shake"
                >
                  <h3 className="font-[family-name:var(--font-display)] text-lg text-red-200/70 mb-2">
                    {scene.title}
                  </h3>
                  <p className="font-mono text-[11px] text-red-200/20 leading-relaxed">
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
        <p className="text-[9px] text-red-900/30 font-mono tracking-wider">
          MONGLI v0.1 // Claude AI + 0G Chain
        </p>
      </motion.div>

      <AmbientAudio />
    </div>
  );
}
