"use client";

import { useState, useEffect, useMemo, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Fragment as FragmentType } from "@/lib/types";
import { generateFragmentVisual } from "@/lib/fragment-visual";

interface FragmentProps {
  fragment: FragmentType;
  onComplete?: () => void;
}

function useVariableTypewriter(text: string) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (i >= text.length) {
        setDone(true);
        return;
      }

      setDisplayed(text.slice(0, i + 1));
      const char = text[i];
      i++;

      let delay = 25;

      // Pause longer after sentence-ending punctuation
      if (char === "." || char === "!" || char === "?") {
        delay = 180 + Math.random() * 120;
      }
      // Medium pause after commas, semicolons, em-dashes
      else if (char === "," || char === ";" || char === "—" || char === ":") {
        delay = 80 + Math.random() * 60;
      }
      // Slight pause after ellipsis dots
      else if (char === "…" || (char === "." && text[i] === ".")) {
        delay = 100 + Math.random() * 80;
      }
      // Short words go faster
      else if (char === " ") {
        const nextWord = text.slice(i).split(/\s/)[0];
        delay = nextWord.length <= 3 ? 15 : nextWord.length >= 8 ? 40 : 25;
      }
      // Random micro-variation on normal chars
      else {
        delay = 20 + Math.random() * 15;
      }

      timeout = setTimeout(tick, delay);
    };

    timeout = setTimeout(tick, 300);

    return () => clearTimeout(timeout);
  }, [text]);

  return { displayed, done };
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours}h`;
}

function getToneConfig(toneScore: number) {
  if (toneScore >= 8) {
    return {
      borderClass: "border-red-900/50",
      glowColor: "rgba(180,40,40,0.08)",
      label: "perturbador",
      barColor: "#991b1b",
      dotColor: "#dc2626",
    };
  }
  if (toneScore >= 5) {
    return {
      borderClass: "border-noir-accent/40",
      glowColor: "rgba(196,146,58,0.06)",
      label: "neutro",
      barColor: "#c4923a",
      dotColor: "#c4923a",
    };
  }
  return {
    borderClass: "border-blue-900/40",
    glowColor: "rgba(60,120,200,0.06)",
    label: "esperanza",
    barColor: "#1d4ed8",
    dotColor: "#3b82f6",
  };
}

function FragmentInner({ fragment, onComplete }: FragmentProps) {
  const { displayed, done } = useVariableTypewriter(fragment.text);
  const hasCalledComplete = useRef(false);

  const rotation = useMemo(() => {
    const seed = fragment.id * 7919;
    return ((seed % 400) - 200) / 100;
  }, [fragment.id]);

  const visual = useMemo(() => generateFragmentVisual(fragment), [fragment]);

  useEffect(() => {
    if (done && onComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  // Reset ref when fragment changes
  useEffect(() => {
    hasCalledComplete.current = false;
  }, [fragment.id]);

  const tone = getToneConfig(fragment.toneScore);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={fragment.id}
        initial={{ opacity: 0, y: 25, rotateZ: rotation * 2 }}
        animate={{ opacity: 1, y: 0, rotateZ: rotation }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="relative max-w-lg mx-auto"
      >
        {/* Polaroid frame with tone-based border */}
        <div
          className={`bg-noir-card ${tone.borderClass} border p-4 sm:p-6 pb-4 shadow-2xl relative overflow-hidden paper-texture uxpm-tap-highlight`}
          style={{ boxShadow: `0 0 30px ${tone.glowColor}, 0 8px 32px rgba(0,0,0,0.5)` }}
        >
          {/* Film grain overlay */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20256%20256%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22n%22%3E%3CfeTurbulence%20baseFrequency=%220.8%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />

          {/* Tape effect */}
          <div
            className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-16 h-3 bg-noir-accent/15"
            style={{ transform: `translateX(-50%) rotate(${rotation > 0 ? 1.5 : -0.8}deg)` }}
          />

          {/* Generative visual */}
          <div
            className="w-full h-[60px] sm:h-[70px] mb-3 rounded-t overflow-hidden relative"
            title="Visual único generado para este fragmento"
            dangerouslySetInnerHTML={{ __html: visual.svgContent }}
          />
          <div className="h-[1px] bg-noir-border/20 mb-3" />

          {/* Fragment number watermark */}
          <div className="absolute top-3 right-4 font-body text-[9px] text-noir-muted/20 tracking-wider">
            #{String(fragment.id).padStart(2, "0")}
          </div>

          {/* Fragment text */}
          <p className="font-display text-noir-text text-xs sm:text-sm leading-[1.8] tracking-wide min-h-[100px] sm:min-h-[130px] relative z-10">
            {displayed}
            {/* Blinking cursor — shows during typewriting AND stays after completion */}
            <motion.span
              className="inline-block w-[2px] h-[1em] align-middle ml-[1px]"
              style={{ backgroundColor: tone.dotColor }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "steps(1)" }}
            />
          </p>

          {/* Metadata section — appears after typewriter finishes */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: done ? 1 : 0, y: done ? 0 : 8 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-5 pt-3 border-t border-noir-border/50"
          >
            {/* Top row: ID, timestamp, tone label */}
            <div className="flex items-center justify-between text-[10px] font-body text-noir-muted mb-3">
              <div className="flex items-center gap-2">
                <span className="text-noir-text/60">#{String(fragment.id).padStart(2, "0")}</span>
                <span className="w-[1px] h-3 bg-noir-border/50" />
                <span>{formatRelativeTime(fragment.timestamp)}</span>
              </div>
              <span
                className="px-1.5 py-0.5 text-[9px] tracking-wider uppercase"
                style={{
                  color: tone.dotColor,
                  border: `1px solid ${tone.dotColor}33`,
                  backgroundColor: `${tone.dotColor}08`,
                }}
              >
                {tone.label}
              </span>
            </div>

            {/* Tone score bar */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-body text-noir-muted/60 w-8 shrink-0">tono</span>
              <div className="flex-1 h-[3px] bg-noir-border/30 relative overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 h-full"
                  style={{ backgroundColor: tone.barColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(fragment.toneScore / 10) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                />
              </div>
              <span
                className="text-[9px] font-mono w-6 text-right"
                style={{ color: tone.dotColor }}
              >
                {fragment.toneScore}
              </span>
            </div>

            {/* Tags row */}
            {fragment.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {fragment.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 text-[9px] font-body border border-noir-border/40 bg-noir-bg/40 text-noir-accent/80 tracking-wider"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Traces */}
            {fragment.traces.length > 0 && (
              <div className="mt-2 pt-2 border-t border-noir-border/20">
                {fragment.traces.map((trace) => (
                  <p
                    key={trace}
                    className="text-[9px] font-body text-noir-muted/50 pl-2 border-l border-noir-accent/20 mb-0.5"
                  >
                    {trace}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Shadow under polaroid */}
        <div
          className="absolute -bottom-2 left-6 right-6 h-4 blur-lg -z-10"
          style={{ backgroundColor: `${tone.glowColor}` }}
        />
        <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/25 blur-md -z-10" />
      </motion.div>
    </AnimatePresence>
  );
}

const Fragment = memo(FragmentInner, (prev, next) => {
  return prev.fragment.id === next.fragment.id;
});

export default Fragment;
