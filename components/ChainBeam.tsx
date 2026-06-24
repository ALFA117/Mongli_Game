"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
}

export default function ChainBeam({ visible }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[45] pointer-events-none flex items-end justify-center"
        >
          <motion.div
            initial={{ height: 0, opacity: 0.8 }}
            animate={{ height: "100vh", opacity: [0.8, 1, 0] }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-[2px] bg-gradient-to-t from-[#c4923a] via-red-500 to-transparent"
            style={{ boxShadow: "0 0 20px rgba(196,146,58,0.4), 0 0 60px rgba(139,0,0,0.2)" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
