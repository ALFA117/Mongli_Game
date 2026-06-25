"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { Fragment } from "@/lib/types";

interface FragmentTimelineProps {
  fragments: Fragment[];
  currentId: number;
  onSelect: (id: number) => void;
}

function getToneColor(toneScore: number): string {
  if (toneScore >= 8) return "#991b1b";
  if (toneScore >= 6) return "#b45309";
  if (toneScore >= 4) return "#c4923a";
  if (toneScore >= 2) return "#1d4ed8";
  return "#2563eb";
}

function getActColor(act: number): string {
  if (act === 1) return "#c4923a";
  if (act === 2) return "#dc2626";
  return "#9333ea";
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > maxLen * 0.6 ? truncated.slice(0, lastSpace) : truncated) + "...";
}

export default function FragmentTimeline({
  fragments,
  currentId,
  onSelect,
}: FragmentTimelineProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (fragments.length === 0) return null;

  const currentAct = currentId <= 5 ? 1 : currentId <= 12 ? 2 : 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="fixed left-3 xl:left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center"
    >
      {/* Act labels */}
      <div className="absolute -left-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
        {[1, 2, 3].map((act) => {
          const startIdx = act === 1 ? 0 : act === 2 ? 5 : 12;
          const isCurrentAct = act === currentAct;
          return (
            <div
              key={act}
              className="absolute text-[7px] font-body tracking-[0.2em] uppercase whitespace-nowrap"
              style={{
                top: `${(startIdx / 14) * 100}%`,
                left: -20,
                color: isCurrentAct ? getActColor(act) : "#2a2a2a",
                transition: "color 0.3s",
              }}
            >
              {isCurrentAct ? `A${act}` : ""}
            </div>
          );
        })}
      </div>

      {/* Nodes */}
      <div className="flex flex-col items-center gap-[6px] relative">
        {/* Animated connector line */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px]"
          style={{ height: "100%" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="timeline-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4923a" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#991b1b" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#9333ea" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="2" height="100%" fill="url(#timeline-grad)" />
        </svg>

        {/* Animated progress fill */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 w-[2px] transition-all duration-700 ease-out"
          style={{
            height: `${(Math.max(0, fragments.length - 1) / 14) * 100}%`,
            background: `linear-gradient(to bottom, ${getActColor(1)}, ${
              fragments.length > 5 ? getActColor(2) : getActColor(1)
            }${fragments.length > 12 ? `, ${getActColor(3)}` : ""})`,
            opacity: 0.6,
          }}
        />

        {Array.from({ length: 15 }, (_, i) => {
          const id = i + 1;
          const fragment = fragments.find((f) => f.id === id);
          const unlocked = !!fragment?.unlocked;
          const isCurrent = id === currentId;
          const act = id <= 5 ? 1 : id <= 12 ? 2 : 3;
          const isCurrentAct = act === currentAct;
          const isActBoundary = id === 1 || id === 6 || id === 13;

          return (
            <div key={id} className="relative">
              {/* Act boundary marker */}
              {isActBoundary && (
                <div
                  className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-[6px] h-[1px]"
                  style={{
                    backgroundColor: isCurrentAct
                      ? getActColor(act)
                      : "rgba(42,42,42,0.5)",
                  }}
                />
              )}

              <motion.button
                onClick={() => unlocked && onSelect(id)}
                onMouseEnter={() => unlocked && setHoveredId(id)}
                onMouseLeave={() => setHoveredId(null)}
                whileHover={unlocked ? { scale: 1.4 } : {}}
                className="relative z-10 rounded-full border transition-all duration-300"
                style={{
                  width: isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  borderColor: unlocked
                    ? isCurrent
                      ? getActColor(act)
                      : getToneColor(fragment!.toneScore)
                    : "rgba(42,42,42,0.4)",
                  backgroundColor: unlocked
                    ? isCurrent
                      ? getActColor(act)
                      : `${getToneColor(fragment!.toneScore)}40`
                    : "rgba(10,10,10,0.8)",
                  boxShadow: isCurrent
                    ? `0 0 10px ${getActColor(act)}60`
                    : "none",
                  opacity: unlocked ? 1 : isCurrentAct ? 0.3 : 0.15,
                }}
                title={unlocked ? `#${id} — tono ${fragment!.toneScore}/10` : "Bloqueado"}
                disabled={!unlocked}
              />

              {/* Hover preview tooltip */}
              <AnimatePresence>
                {hoveredId === id && fragment && (
                  <motion.div
                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-7 top-1/2 -translate-y-1/2 w-56 bg-noir-card border border-noir-border p-3 shadow-xl z-[100]"
                    style={{
                      borderLeftColor: getToneColor(fragment.toneScore),
                      borderLeftWidth: 2,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-body text-noir-muted">
                        #{String(id).padStart(2, "0")} — Acto {act}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: getToneColor(fragment.toneScore) }}
                      >
                        {fragment.toneScore}/10
                      </span>
                    </div>
                    <p className="font-display text-[11px] text-noir-text/80 leading-relaxed">
                      {truncateText(fragment.text, 120)}
                    </p>
                    {fragment.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {fragment.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[8px] font-body text-noir-accent/60 px-1 border border-noir-border/30"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
