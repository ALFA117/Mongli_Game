"use client";

import { motion } from "framer-motion";
import { Choice } from "@/lib/types";

interface Props {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

export default function ChoicePanel({ choices, onChoose, disabled }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="mt-8 w-full"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-red-900/30" />
        <span className="text-[10px] font-mono text-red-500/40 uppercase tracking-[0.3em]">
          Elige tu destino
        </span>
        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-red-900/30" />
      </div>

      <div className="flex flex-col gap-3">
        {choices.map((choice, i) => (
          <motion.button
            key={choice.id}
            whileHover={disabled ? {} : { scale: 1.01 }}
            whileTap={disabled ? {} : { scale: 0.99 }}
            onClick={() => !disabled && onChoose(choice)}
            disabled={disabled}
            className={`choice-btn relative w-full p-5 border text-left font-mono text-sm overflow-hidden
              transition-all duration-300 group
              ${choice.tone === "dark"
                ? "border-red-900/30 text-red-200/70 hover:border-red-700/60"
                : "border-[#c4923a]/30 text-[#e8d5b0]/70 hover:border-[#c4923a]/60"
              }
              ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
              bg-black`}
          >
            {/* Fill animation on hover */}
            <div className={`absolute bottom-0 left-0 w-full h-0 group-hover:h-full transition-all duration-500 ease-out
              ${choice.tone === "dark" ? "bg-red-950/30" : "bg-[#c4923a]/10"}`}
            />
            <span className="relative z-10 flex items-center gap-3">
              <span className={`text-[10px] uppercase tracking-widest
                ${choice.tone === "dark" ? "text-red-700/50" : "text-[#c4923a]/50"}`}>
                {i === 0 ? "A" : "B"}
              </span>
              <span className="hover-shake">{choice.text}</span>
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
