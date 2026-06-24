"use client";

import { motion } from "framer-motion";
import { Fragment as FragmentType } from "@/lib/types";
import { useEffect, useState } from "react";

interface Props {
  fragment: FragmentType;
  isNew?: boolean;
}

export default function Fragment({ fragment, isNew = false }: Props) {
  const [displayText, setDisplayText] = useState(isNew ? "" : fragment.text);
  const [showMeta, setShowMeta] = useState(!isNew);
  const [flash, setFlash] = useState(isNew);

  useEffect(() => {
    if (isNew) {
      setFlash(true);
      setTimeout(() => setFlash(false), 150);
    }
  }, [isNew]);

  useEffect(() => {
    if (!isNew) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fragment.text.slice(0, i + 1));
      i++;
      if (i >= fragment.text.length) {
        clearInterval(interval);
        setTimeout(() => setShowMeta(true), 300);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [fragment.text, isNew]);

  return (
    <>
      {flash && (
        <motion.div
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-white z-50 pointer-events-none"
        />
      )}
      <motion.div
        initial={isNew ? { opacity: 0, scale: 0.95, rotateZ: -1 } : {}}
        animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
        transition={{ duration: 0.6 }}
        className="polaroid-card relative w-full"
      >
        <div className="bg-[#0a0a0a] border border-[#c4923a]/20 p-1">
          <div className="border border-[#1a1a1a] p-5 relative overflow-hidden">
            {/* Burn marks */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#1a0a00]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-[#0a0000]/30 to-transparent" />

            {/* Fragment number */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-mono text-red-700/60 uppercase tracking-widest">
                Fragmento #{fragment.id.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-[#c4923a]/30">
                {fragment.tone_score}/10
              </span>
            </div>

            {/* Text */}
            <p className="text-[#e8d5b0] font-mono text-sm leading-relaxed min-h-[100px]">
              {displayText}
              {isNew && displayText.length < fragment.text.length && (
                <span className="animate-pulse text-red-600">█</span>
              )}
            </p>

            {/* Tags */}
            {showMeta && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 space-y-3"
              >
                <div className="flex flex-wrap gap-1.5">
                  {fragment.tags.map((tag) => (
                    <span key={tag} className="text-[9px] text-red-400/40 border border-red-900/20 px-1.5 py-0.5 font-mono uppercase">
                      {tag}
                    </span>
                  ))}
                </div>

                {fragment.traces.length > 0 && (
                  <div className="border-t border-[#1a1a1a] pt-2">
                    <p className="text-[9px] text-[#c4923a]/30 font-mono uppercase mb-1 tracking-wider">
                      Trazas
                    </p>
                    {fragment.traces.map((trace) => (
                      <p key={trace} className="text-[11px] text-[#e8d5b0]/30 font-mono italic">
                        → {trace}
                      </p>
                    ))}
                  </div>
                )}

                {/* On-chain hash */}
                {fragment.storage_hash && (
                  <div className="border-t border-[#1a1a1a] pt-2 flex items-center gap-2">
                    <span className="text-[9px] text-green-500/50 font-mono">GRABADO EN CADENA ✓</span>
                    <span className="text-[9px] text-green-400/30 font-mono truncate">
                      {fragment.storage_hash.slice(0, 18)}...
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
