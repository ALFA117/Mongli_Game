"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useRef } from "react";

type GlitchMode = "digital" | "analog" | "corruption";

interface GlitchTextProps {
  text: string;
  className?: string;
  intensity?: "low" | "medium" | "high";
  as?: "h1" | "h2" | "h3" | "p" | "span";
  onGlitch?: boolean;
  mode?: GlitchMode;
}

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`01";
const BLOCK_CHARS = "█▓▒░▐▌▄▀■□";

export default function GlitchText({
  text,
  className = "",
  intensity = "low",
  as: Tag = "span",
  onGlitch,
  mode,
}: GlitchTextProps) {
  const [display, setDisplay] = useState(text);
  const [glitching, setGlitching] = useState(false);
  const [activeMode, setActiveMode] = useState<GlitchMode>("corruption");
  const [analogOffset, setAnalogOffset] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const config = {
    low: { interval: 8000, duration: 150, chars: 1 },
    medium: { interval: 4000, duration: 300, chars: 3 },
    high: { interval: 2000, duration: 500, chars: 5 },
  }[intensity];

  const triggerGlitch = useCallback(
    (glitchMode?: GlitchMode) => {
      const chosen = glitchMode || (["digital", "analog", "corruption"] as const)[Math.floor(Math.random() * 3)];
      setActiveMode(chosen);
      setGlitching(true);

      const chars = text.split("");
      const iterations = Math.floor(config.duration / 40);
      let i = 0;

      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        if (chosen === "digital") {
          const glitched = [...chars];
          const blockStart = Math.floor(Math.random() * glitched.length);
          const blockLen = Math.min(config.chars + 2, glitched.length - blockStart);
          for (let j = blockStart; j < blockStart + blockLen; j++) {
            glitched[j] = BLOCK_CHARS[Math.floor(Math.random() * BLOCK_CHARS.length)];
          }
          setDisplay(glitched.join(""));
        } else if (chosen === "analog") {
          setAnalogOffset((Math.random() - 0.5) * 8);
          const glitched = [...chars];
          const shiftAmount = Math.floor(Math.random() * 3);
          for (let j = 0; j < shiftAmount; j++) {
            const idx = Math.floor(Math.random() * glitched.length);
            if (glitched[idx] !== " ") {
              glitched[idx] = chars[(idx + 1) % chars.length];
            }
          }
          setDisplay(glitched.join(""));
        } else {
          const glitched = [...chars];
          for (let j = 0; j < config.chars; j++) {
            const idx = Math.floor(Math.random() * glitched.length);
            if (glitched[idx] !== " ") {
              glitched[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
            }
          }
          setDisplay(glitched.join(""));
        }

        i++;
        if (i >= iterations) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setDisplay(text);
          setGlitching(false);
          setAnalogOffset(0);
        }
      }, 40);
    },
    [text, config.chars, config.duration]
  );

  // Auto-trigger on interval
  useEffect(() => {
    const autoInterval = setInterval(() => triggerGlitch(mode), config.interval);
    const initDelay = setTimeout(() => triggerGlitch(mode), 500 + Math.random() * 1000);
    return () => {
      clearInterval(autoInterval);
      clearTimeout(initDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [triggerGlitch, config.interval, mode]);

  // External trigger via onGlitch prop
  useEffect(() => {
    if (onGlitch) {
      triggerGlitch(mode || "digital");
    }
  }, [onGlitch, triggerGlitch, mode]);

  // Sync display with text prop changes
  useEffect(() => {
    if (!glitching) setDisplay(text);
  }, [text, glitching]);

  return (
    <Tag
      className={`relative inline-block ${className}`}
      style={
        activeMode === "analog" && glitching
          ? { transform: `translateX(${analogOffset}px)` }
          : undefined
      }
    >
      {display}

      {/* Ghost text shadows — always present, subtle */}
      <span
        className="absolute inset-0 select-none"
        style={{
          color: "rgba(255, 60, 60, 0.08)",
          transform: "translate(1.5px, 0.5px)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {display}
      </span>
      <span
        className="absolute inset-0 select-none"
        style={{
          color: "rgba(60, 220, 255, 0.06)",
          transform: "translate(-1px, -0.5px)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        {display}
      </span>

      {/* Active glitch overlays */}
      {glitching && activeMode === "digital" && (
        <>
          <motion.span
            className="absolute inset-0 text-red-500/40 select-none"
            style={{ clipPath: `inset(${15 + Math.random() * 30}% 0 ${30 + Math.random() * 20}% 0)` }}
            animate={{ x: [-3, 4, -2, 0] }}
            transition={{ duration: 0.08, repeat: 4 }}
            aria-hidden="true"
          >
            {display}
          </motion.span>
          <motion.span
            className="absolute inset-0 text-cyan-400/30 select-none"
            style={{ clipPath: `inset(${50 + Math.random() * 20}% 0 ${5 + Math.random() * 15}% 0)` }}
            animate={{ x: [3, -4, 2, 0] }}
            transition={{ duration: 0.08, repeat: 4 }}
            aria-hidden="true"
          >
            {display}
          </motion.span>
        </>
      )}

      {glitching && activeMode === "analog" && (
        <motion.span
          className="absolute inset-0 select-none"
          style={{
            color: "rgba(232,213,176,0.3)",
            clipPath: "inset(0 0 50% 0)",
            mixBlendMode: "screen",
          }}
          animate={{ y: [-1, 1, -0.5, 0] }}
          transition={{ duration: 0.06, repeat: 6 }}
          aria-hidden="true"
        >
          {display}
        </motion.span>
      )}

      {glitching && activeMode === "corruption" && (
        <>
          <motion.span
            className="absolute inset-0 text-red-500/35 select-none"
            style={{ clipPath: "inset(20% 0 50% 0)" }}
            animate={{ x: [-2, 3, -1, 0], skewX: [-2, 1, 0] }}
            transition={{ duration: 0.1, repeat: 3 }}
            aria-hidden="true"
          >
            {display}
          </motion.span>
          <motion.span
            className="absolute inset-0 text-cyan-500/25 select-none"
            style={{ clipPath: "inset(60% 0 10% 0)" }}
            animate={{ x: [2, -3, 1, 0], skewX: [1, -2, 0] }}
            transition={{ duration: 0.1, repeat: 3 }}
            aria-hidden="true"
          >
            {display}
          </motion.span>
        </>
      )}
    </Tag>
  );
}
