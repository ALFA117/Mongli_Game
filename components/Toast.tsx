"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  message: string;
  hash?: string;
  visible: boolean;
}

export default function Toast({ message, hash, visible }: Props) {
  const [show, setShow] = useState(visible);

  useEffect(() => {
    setShow(visible);
    if (visible) {
      const t = setTimeout(() => setShow(false), 4000);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed top-4 right-4 z-50 bg-black/90 border border-green-900/50 px-4 py-3 font-mono text-xs max-w-sm"
        >
          <span className="text-green-500/80">[0G]</span>{" "}
          <span className="text-[#e8d5b0]/70">{message}</span>
          {hash && (
            <p className="text-green-400/40 mt-1 text-[10px] truncate">
              → {hash}
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
