"use client";

import { motion } from "framer-motion";
import { Fragment } from "@/lib/types";
import { useAccount } from "wagmi";

const ACT_NAMES: Record<number, string> = {
  1: "LA AMNESIA",
  2: "EL DESDOBLAMIENTO",
  3: "LA REVELACIÓN",
};

interface Props {
  fragmentCount: number;
  currentAct: number;
  latestFragment: Fragment | null;
  fragments: Fragment[];
  onMapNodeClick?: (f: Fragment) => void;
}

export default function HUD({ fragmentCount, currentAct, latestFragment, fragments, onMapNodeClick }: Props) {
  const { address } = useAccount();

  return (
    <>
      {/* Top Left - Progress */}
      <div className="fixed top-4 left-4 z-40 font-mono">
        <div className="bg-black/80 border border-red-900/20 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-red-500/70 uppercase tracking-widest">
              Fragmento {String(fragmentCount).padStart(2, "0")}/15
            </span>
            <span className="text-[#2a2a2a]">│</span>
            <span className="text-[#c4923a]/60 uppercase tracking-wider">
              Acto {currentAct} — {ACT_NAMES[currentAct]}
            </span>
          </div>
          <div className="mt-2 w-48 h-1 bg-[#1a1a1a] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-900 to-[#c4923a]"
              animate={{ width: `${(fragmentCount / 15) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>
      </div>

      {/* Top Right - Wallet & Chain */}
      <div className="fixed top-4 right-4 z-40 font-mono">
        <div className="bg-black/80 border border-[#c4923a]/10 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-[10px]">
            {address && (
              <span className="text-[#e8d5b0]/30">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
            )}
            <span className="text-[#2a2a2a]">│</span>
            <span className="text-green-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/60 animate-pulse" />
              Galileo
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Right - Minimap */}
      <div className="fixed bottom-4 right-4 z-40 hidden sm:block">
        <div className="bg-black/80 border border-[#c4923a]/10 p-3 backdrop-blur-sm">
          <p className="text-[8px] font-mono text-[#c4923a]/30 uppercase tracking-widest mb-2 text-center">
            Recuerdos
          </p>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 15 }, (_, i) => {
              const f = fragments.find((fr) => fr.id === i + 1);
              return (
                <button
                  key={i}
                  onClick={() => f && onMapNodeClick?.(f)}
                  className={`w-3 h-3 rounded-sm transition-all ${
                    f
                      ? i + 1 === fragmentCount
                        ? "bg-red-600 animate-pulse shadow-[0_0_4px_rgba(220,0,0,0.5)] cursor-pointer"
                        : "bg-[#c4923a]/60 hover:bg-[#c4923a] cursor-pointer"
                      : "bg-[#1a1a1a]"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
