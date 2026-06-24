"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  "Accediendo a memoria...",
  "Contactando 0G Storage...",
  "IA procesando fragmento...",
  "Grabando en cadena...",
];

export default function LoadingSequence() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 border border-red-900/40 rounded-full animate-ping" />
        <div className="absolute inset-2 border border-[#c4923a]/30 rounded-full animate-spin" style={{ animationDuration: "3s" }} />
        <div className="absolute inset-4 border-t border-red-700/60 rounded-full animate-spin" style={{ animationDuration: "1.5s" }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="font-mono text-xs text-[#c4923a]/60 tracking-wider"
        >
          {STEPS[step]}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1 mt-4">
        {STEPS.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-red-700/60" : "bg-[#2a2a2a]"}`} />
        ))}
      </div>
    </div>
  );
}
