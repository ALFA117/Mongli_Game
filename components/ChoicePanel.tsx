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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mt-8"
    >
      {choices.map((choice, i) => (
        <motion.button
          key={choice.id}
          whileHover={disabled ? {} : { scale: 1.02, borderColor: "#c4923a" }}
          whileTap={disabled ? {} : { scale: 0.98 }}
          onClick={() => !disabled && onChoose(choice)}
          disabled={disabled}
          className={`flex-1 p-4 border text-left transition-all font-mono text-sm
            ${
              choice.tone === "dark"
                ? "border-red-900/40 hover:border-red-700/60 text-red-200/80"
                : "border-amber-900/40 hover:border-amber-600/60 text-amber-200/80"
            }
            ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
            bg-[#0a0a0a] hover:bg-[#111111]`}
        >
          <span className="text-[10px] text-[#c4923a]/40 uppercase block mb-2">
            Opción {i === 0 ? "A" : "B"}
          </span>
          {choice.text}
        </motion.button>
      ))}
    </motion.div>
  );
}
