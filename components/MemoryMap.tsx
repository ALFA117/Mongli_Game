"use client";

import { motion } from "framer-motion";
import { Fragment } from "@/lib/types";

interface Props {
  fragments: Fragment[];
  activeId?: number;
  onSelect: (fragment: Fragment) => void;
  totalSlots?: number;
}

function Hexagon({ unlocked, active, index, onClick }: {
  unlocked: boolean; active: boolean; index: number; onClick: () => void;
}) {
  const fill = active
    ? "#8b0000"
    : unlocked
      ? "#c4923a"
      : "#1a1a1a";

  const glow = active
    ? "drop-shadow(0 0 8px rgba(139,0,0,0.6))"
    : unlocked
      ? "drop-shadow(0 0 4px rgba(196,146,58,0.3))"
      : "none";

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={unlocked ? "cursor-pointer" : "cursor-not-allowed"}
      style={{ filter: glow }}
    >
      <polygon
        points="30,0 60,17 60,52 30,69 0,52 0,17"
        fill={active ? "#1a0000" : "#0a0a0a"}
        stroke={fill}
        strokeWidth={active ? 2 : 1}
        className={`transition-all duration-300 ${unlocked ? "hover:stroke-[#e8d5b0]" : ""}`}
      />
      {active && (
        <polygon
          points="30,0 60,17 60,52 30,69 0,52 0,17"
          fill="none"
          stroke="#8b0000"
          strokeWidth={2}
          className="animate-pulse"
        />
      )}
      {unlocked ? (
        <text x="30" y="40" textAnchor="middle" fill={active ? "#ff4444" : "#c4923a"} fontSize="11" fontFamily="monospace">
          {String(index + 1).padStart(2, "0")}
        </text>
      ) : (
        <g transform="translate(22, 25)">
          <rect x="2" y="6" width="12" height="10" rx="1" fill="none" stroke="#333" strokeWidth="1" />
          <path d="M5,6 V4 a3,3 0 0,1 6,0 V6" fill="none" stroke="#333" strokeWidth="1" />
        </g>
      )}
    </motion.g>
  );
}

export default function MemoryMap({ fragments, activeId, onSelect, totalSlots = 15 }: Props) {
  const cols = 5;
  const hexW = 65;
  const hexH = 55;

  return (
    <div className="w-full overflow-visible">
      <svg
        viewBox={`-5 -5 ${cols * hexW + 40} ${Math.ceil(totalSlots / cols) * hexH + 30}`}
        className="w-full max-w-sm mx-auto"
      >
        {/* Connection lines */}
        {fragments.map((f) => {
          if (f.id >= totalSlots) return null;
          const next = fragments.find((nf) => nf.id === f.id + 1);
          if (!next) return null;

          const row1 = Math.floor((f.id - 1) / cols);
          const col1 = (f.id - 1) % cols;
          const row2 = Math.floor((next.id - 1) / cols);
          const col2 = (next.id - 1) % cols;

          const x1 = col1 * hexW + (row1 % 2 ? hexW / 2 : 0) + 30;
          const y1 = row1 * hexH + 35;
          const x2 = col2 * hexW + (row2 % 2 ? hexW / 2 : 0) + 30;
          const y2 = row2 * hexH + 35;

          return (
            <line
              key={`line-${f.id}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="url(#lineGrad)"
              strokeWidth="1"
              opacity="0.4"
            />
          );
        })}

        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b0000" />
            <stop offset="100%" stopColor="#c4923a" />
          </linearGradient>
        </defs>

        {Array.from({ length: totalSlots }, (_, i) => {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = col * hexW + (row % 2 ? hexW / 2 : 0);
          const y = row * hexH;
          const fragment = fragments.find((f) => f.id === i + 1);

          return (
            <g key={i} transform={`translate(${x}, ${y})`}>
              <Hexagon
                unlocked={!!fragment}
                active={activeId === i + 1}
                index={i}
                onClick={() => fragment && onSelect(fragment)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
