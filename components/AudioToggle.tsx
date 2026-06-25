"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  playAmbient,
  stopAmbient,
  setGlobalVolume,
  getGlobalVolume,
  getCurrentAct,
  playTuneIn,
} from "@/lib/audio";

const BAR_CHARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
const BAR_COUNT = 10;

function getNeedleAngle(act: 1 | 2 | 3 | "revelation"): number {
  if (act === 1) return -35;
  if (act === 2) return 0;
  if (act === 3) return -40;
  return 0;
}

export default function AudioToggle() {
  const [active, setActive] = useState(true);
  const [showVolume, setShowVolume] = useState(false);
  const [volume, setVolume] = useState(60);
  const [bars, setBars] = useState<number[]>(Array(BAR_COUNT).fill(0));
  const [needleAngle, setNeedleAngle] = useState(-35);
  const barsRef = useRef<ReturnType<typeof setInterval>>();
  const needleRef = useRef<ReturnType<typeof setInterval>>();

  // Visualizer bars
  useEffect(() => {
    if (!active) {
      setBars(Array(BAR_COUNT).fill(0));
      if (barsRef.current) clearInterval(barsRef.current);
      return;
    }
    barsRef.current = setInterval(() => {
      setBars(
        Array.from({ length: BAR_COUNT }, () =>
          Math.floor(Math.random() * 5 + Math.random() * 3)
        )
      );
    }, 120);
    return () => { if (barsRef.current) clearInterval(barsRef.current); };
  }, [active]);

  // Needle position based on act
  useEffect(() => {
    const update = () => {
      const act = getCurrentAct();
      if (act === "revelation") {
        // Oscillate
        setNeedleAngle(Math.sin(Date.now() * 0.003) * 40);
      } else {
        setNeedleAngle(getNeedleAngle(act));
      }
    };
    needleRef.current = setInterval(update, 200);
    return () => { if (needleRef.current) clearInterval(needleRef.current); };
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      stopAmbient();
    } else {
      playTuneIn();
      setTimeout(() => playAmbient(), 300);
    }
    setActive(!active);
  }, [active]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setVolume(v);
    setGlobalVolume(v / 100);
  }, []);

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] group"
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      {/* Volume slider — appears on hover */}
      <AnimatePresence>
        {showVolume && active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full mb-2 right-0 uxpm-glass p-2 flex flex-col items-center"
          >
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={handleVolumeChange}
              className="h-20 appearance-none bg-transparent"
              style={{
                writingMode: "vertical-lr",
                direction: "rtl",
                accentColor: "#c4923a",
              }}
            />
            <span className="text-[8px] font-mono text-noir-muted mt-1">{volume}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radio body */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.95 }}
        className="uxpm-glass uxpm-press w-[68px] sm:w-[76px] rounded-lg p-1.5 sm:p-2 flex flex-col items-center gap-1"
        style={{
          boxShadow: active
            ? "0 0 12px rgba(196,146,58,0.15), inset 0 1px 0 rgba(232,213,176,0.05)"
            : "none",
        }}
        title={active ? "Silenciar" : "Activar sonido"}
      >
        {/* ON AIR indicator */}
        <div className="flex items-center gap-1">
          <motion.div
            className="w-1.5 h-1.5 rounded-full"
            animate={{
              backgroundColor: active ? "#dc2626" : "#2a2a2a",
              boxShadow: active ? "0 0 4px #dc262660" : "none",
            }}
          />
          <span
            className="text-[6px] font-body uppercase tracking-[0.15em]"
            style={{ color: active ? "#dc2626" : "#2a2a2a" }}
          >
            ON AIR
          </span>
        </div>

        {/* Frequency dial (SVG) */}
        <svg viewBox="0 0 50 20" className="w-full h-3 sm:h-4">
          {/* Dial background */}
          <rect x="2" y="2" width="46" height="16" rx="2" fill="none" stroke="#2a2a2a" strokeWidth="0.5" />
          {/* Frequency marks */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={i}
              x1={6 + i * 5}
              y1={14}
              x2={6 + i * 5}
              y2={i % 2 === 0 ? 10 : 12}
              stroke="#2a2a2a"
              strokeWidth="0.3"
            />
          ))}
          {/* Needle */}
          <motion.line
            x1={25}
            y1={16}
            x2={25}
            y2={4}
            stroke={active ? "#c4923a" : "#2a2a2a"}
            strokeWidth="0.8"
            strokeLinecap="round"
            style={{ transformOrigin: "25px 16px" }}
            animate={{ rotate: needleAngle }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* ASCII frequency visualizer */}
        <div
          className="font-mono text-[7px] sm:text-[8px] leading-none tracking-tighter h-3 flex items-end"
          style={{ color: active ? "#c4923a" : "#2a2a2a" }}
        >
          {bars.map((level, i) => (
            <span key={i}>{BAR_CHARS[Math.min(level, BAR_CHARS.length - 1)]}</span>
          ))}
        </div>
      </motion.button>
    </div>
  );
}
