"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  hash?: string;
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, hash, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 50, x: "-50%" }}
          className="fixed bottom-6 left-1/2 z-[9999] bg-noir-card border border-noir-accent/40 px-5 py-3 shadow-xl"
        >
          <div className="flex items-center gap-3 font-body text-xs">
            <span className="text-green-500 text-sm">&#10003;</span>
            <div>
              <p className="text-noir-text">{message}</p>
              {hash && (
                <p className="text-noir-muted mt-0.5 font-mono text-[10px]">
                  {hash.slice(0, 8)}...{hash.slice(-6)}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
