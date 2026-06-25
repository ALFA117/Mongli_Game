"use client";

import { motion } from "framer-motion";
import type { Choice } from "@/lib/types";

interface ChoicePanelProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

export default function ChoicePanel({ choices, onChoose, disabled }: ChoicePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto mt-6 sm:mt-8 px-2 sm:px-0"
    >
      {choices.map((choice, i) => (
        <motion.button
          key={choice.id}
          onClick={() => !disabled && onChoose(choice)}
          disabled={disabled}
          whileHover={disabled ? {} : { scale: 1.03, y: -2 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.2 }}
          {...(choice.tone === "dark"
            ? { "data-choice-dark": true }
            : { "data-choice-light": true })}
          className={`
            flex-1 p-4 sm:p-5 border-2 text-left transition-all duration-300 group relative overflow-hidden uxpm-press uxpm-tap-highlight min-h-[80px]
            ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-none"}
            ${
              choice.tone === "dark"
                ? "border-red-800/60 hover:border-red-600/80 hover:bg-red-950/30 shadow-[0_0_12px_rgba(180,40,40,0.15)]"
                : "border-noir-accent/60 hover:border-noir-accent hover:bg-noir-accent/15 shadow-[0_0_12px_rgba(196,146,58,0.15)]"
            }
            bg-noir-card
          `}
        >
          {/* Hover glow effect */}
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
              choice.tone === "dark"
                ? "bg-gradient-to-br from-red-900/10 to-transparent"
                : "bg-gradient-to-br from-noir-accent/10 to-transparent"
            }`}
          />

          <div className="relative z-10">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-noir-muted font-body">
                {choice.tone === "dark" ? "Sombra" : "Luz"}
              </span>
              {choice.isPointOfNoReturn && (
                <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-red-900/30 text-red-400 border border-red-800/40 font-body">
                  sin retorno
                </span>
              )}
            </div>

            {/* Choice text */}
            <p className="font-display text-xs sm:text-sm text-noir-text leading-relaxed">
              {choice.text}
            </p>

            {/* Narrative consequence preview */}
            {choice.narrativeConsequence && (
              <p className="font-body text-[9px] text-noir-muted/50 mt-2 italic leading-relaxed">
                {choice.narrativeConsequence}
              </p>
            )}
          </div>

          {/* Corner accent */}
          <div
            className={`absolute bottom-0 right-0 w-8 h-8 ${
              choice.tone === "dark" ? "bg-red-900/20" : "bg-noir-accent/20"
            }`}
            style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
          />

          {/* Point of no return warning glow */}
          {choice.isPointOfNoReturn && (
            <motion.div
              className="absolute inset-0 border-2 border-red-800/0 pointer-events-none"
              animate={{
                borderColor: [
                  "rgba(153,27,27,0)",
                  "rgba(153,27,27,0.3)",
                  "rgba(153,27,27,0)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}
