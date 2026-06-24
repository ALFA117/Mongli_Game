"use client";

import { motion } from "framer-motion";
import { Fragment } from "@/lib/types";

interface Props {
  fragments: Fragment[];
  onSelect: (fragment: Fragment) => void;
  totalSlots?: number;
}

export default function MemoryMap({
  fragments,
  onSelect,
  totalSlots = 15,
}: Props) {
  const slots = Array.from({ length: totalSlots }, (_, i) => {
    return fragments.find((f) => f.id === i + 1) || null;
  });

  return (
    <div className="grid grid-cols-5 gap-3 max-w-md mx-auto">
      {slots.map((fragment, i) => (
        <motion.button
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => fragment && onSelect(fragment)}
          disabled={!fragment}
          className={`aspect-square border font-mono text-xs flex items-center justify-center transition-all
            ${
              fragment
                ? "border-[#c4923a]/50 bg-[#111111] text-[#e8d5b0] hover:border-[#c4923a] hover:bg-[#1a1a1a] cursor-pointer"
                : "border-[#2a2a2a] bg-[#0a0a0a]/50 text-[#2a2a2a] cursor-not-allowed backdrop-blur-sm"
            }`}
        >
          {fragment ? (
            <span className="text-[#c4923a]">
              #{(i + 1).toString().padStart(2, "0")}
            </span>
          ) : (
            <svg
              className="w-4 h-4 opacity-30"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          )}
        </motion.button>
      ))}
    </div>
  );
}
