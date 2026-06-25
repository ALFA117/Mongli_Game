"use client";

import { motion } from "framer-motion";
import { useCallback } from "react";

interface MobileNavProps {
  onLeft: () => void;
  onRight: () => void;
  leftDisabled?: boolean;
  rightDisabled?: boolean;
  visible?: boolean;
}

function triggerHaptic(duration = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

export default function MobileNav({
  onLeft,
  onRight,
  leftDisabled = false,
  rightDisabled = false,
  visible = true,
}: MobileNavProps) {
  const handleLeft = useCallback(() => {
    if (leftDisabled) return;
    triggerHaptic();
    onLeft();
  }, [onLeft, leftDisabled]);

  const handleRight = useCallback(() => {
    if (rightDisabled) return;
    triggerHaptic();
    onRight();
  }, [onRight, rightDisabled]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9990] flex items-center gap-4 lg:hidden uxpm-safe-bottom">
      {/* Left arrow */}
      <motion.button
        onClick={handleLeft}
        whileTap={{ scale: 0.9 }}
        disabled={leftDisabled}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center uxpm-glass uxpm-press uxpm-tap-highlight
          ${leftDisabled ? "opacity-20" : "opacity-70 active:opacity-100"}
        `}
        aria-label="Fragmento anterior"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-noir-accent">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </motion.button>

      {/* Right arrow */}
      <motion.button
        onClick={handleRight}
        whileTap={{ scale: 0.9 }}
        disabled={rightDisabled}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center uxpm-glass uxpm-press uxpm-tap-highlight
          ${rightDisabled ? "opacity-20" : "opacity-70 active:opacity-100"}
        `}
        aria-label="Siguiente fragmento"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-noir-accent">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.button>
    </div>
  );
}
