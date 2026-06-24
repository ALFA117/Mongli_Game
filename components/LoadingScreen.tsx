"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LINES = [
  { text: "> Inicializando MONGLI...", delay: 0 },
  { text: "> Conectando a 0G Storage...", delay: 600 },
  { text: "> Cargando fragmentos...", delay: 1200 },
  { text: "> Calibrando memoria...", delay: 1800 },
  { text: "> SISTEMA LISTO", delay: 2400 },
];

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    LINES.forEach((line, i) => {
      setTimeout(() => setVisibleLines(i + 1), line.delay);
    });

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { clearInterval(progressInterval); return 100; }
        return p + 2;
      });
    }, 50);

    setTimeout(() => setDone(true), 3200);
    setTimeout(onComplete, 3800);

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-4"
        >
          <div className="w-full max-w-md">
            <div className="space-y-2 mb-8">
              {LINES.slice(0, visibleLines).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-mono text-sm flex items-center gap-2"
                >
                  <span className={i === LINES.length - 1 ? "text-red-500" : "text-green-500/70"}>
                    {line.text}
                  </span>
                  {i < LINES.length - 1 && i < visibleLines - 1 && (
                    <span className="text-green-400/50 text-xs">✓</span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Retro progress bar */}
            <div className="w-full h-3 border border-green-900/40 bg-black p-[1px]">
              <div
                className="h-full bg-green-600/60 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-green-500/30 mt-2 text-right">
              {progress}%
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
