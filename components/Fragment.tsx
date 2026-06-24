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
  const [showHash, setShowHash] = useState(false);

  useEffect(() => {
    if (!isNew) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fragment.text.slice(0, i + 1));
      i++;
      if (i >= fragment.text.length) {
        clearInterval(interval);
        setTimeout(() => setShowHash(true), 500);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [fragment.text, isNew]);

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20, rotateZ: -1 } : {}}
      animate={{ opacity: 1, y: 0, rotateZ: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative max-w-lg mx-auto"
    >
      <div className="bg-[#111111] border border-[#c4923a]/30 p-6 shadow-2xl">
        <div className="absolute -top-3 -left-3 bg-[#c4923a] text-[#0a0a0a] text-xs font-bold px-2 py-1 font-mono">
          #{fragment.id.toString().padStart(2, "0")}
        </div>

        <p className="text-[#e8d5b0] font-mono text-sm leading-relaxed min-h-[120px]">
          {displayText}
          {isNew && displayText.length < fragment.text.length && (
            <span className="animate-pulse text-[#c4923a]">|</span>
          )}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {fragment.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-[#c4923a]/60 border border-[#c4923a]/20 px-2 py-0.5 font-mono uppercase"
            >
              {tag}
            </span>
          ))}
        </div>

        {fragment.traces.length > 0 && (
          <div className="mt-3 border-t border-[#2a2a2a] pt-3">
            <p className="text-[10px] text-[#c4923a]/40 font-mono uppercase mb-1">
              Trazas descubiertas:
            </p>
            {fragment.traces.map((trace) => (
              <p
                key={trace}
                className="text-xs text-[#e8d5b0]/50 font-mono italic"
              >
                → {trace}
              </p>
            ))}
          </div>
        )}

        {(showHash || !isNew) && fragment.storage_hash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-[10px] text-[#c4923a]/30 font-mono truncate"
          >
            0G: {fragment.storage_hash.slice(0, 20)}...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
