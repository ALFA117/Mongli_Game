"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import { INITIAL_SCENES } from "@/lib/types";

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const startGame = (sceneId: string) => {
    router.push(`/game?scene=${sceneId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="text-center mb-12"
      >
        <h1 className="font-[family-name:var(--font-display)] text-5xl sm:text-7xl text-[#c4923a] mb-4 tracking-wide">
          MONGLI
        </h1>
        <div className="w-24 h-[1px] bg-[#c4923a]/30 mx-auto mb-4" />
        <p className="font-mono text-sm text-[#e8d5b0]/50 max-w-md mx-auto leading-relaxed">
          No sabes quién eres. Cada decisión desbloquea un fragmento de memoria.
          <br />
          La IA escribe tu historia. La blockchain la guarda para siempre.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mb-12"
      >
        <WalletButton />
      </motion.div>

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-2xl"
        >
          <p className="text-center text-xs text-[#c4923a]/40 font-mono uppercase tracking-widest mb-6">
            Elige dónde despertar
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {INITIAL_SCENES.map((scene, i) => (
              <motion.button
                key={scene.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                whileHover={{ scale: 1.02, borderColor: "#c4923a" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startGame(scene.id)}
                className="border border-[#2a2a2a] bg-[#111111] p-6 text-left transition-all hover:bg-[#151515] cursor-pointer"
              >
                <h3 className="font-[family-name:var(--font-display)] text-lg text-[#c4923a] mb-2">
                  {scene.title}
                </h3>
                <p className="font-mono text-xs text-[#e8d5b0]/40 leading-relaxed">
                  {scene.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="fixed bottom-4 text-center"
      >
        <p className="text-[10px] text-[#2a2a2a] font-mono">
          Powered by Claude AI + 0G Blockchain
        </p>
      </motion.div>
    </div>
  );
}
