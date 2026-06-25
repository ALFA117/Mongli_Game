"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect, useMemo, memo } from "react";
import type { Fragment } from "@/lib/types";

interface MemoryMapProps {
  fragments: Fragment[];
  currentId: number;
  onSelect: (id: number) => void;
  newlyUnlockedId?: number;
}

// Seeded PRNG for deterministic "organic" positions
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Generate organic node positions from a seed
function generateNodePositions(): { x: number; y: number }[] {
  const rng = seededRandom(42_7919);
  const base = [
    // Act I (1-5): top cluster
    { x: 50, y: 8 },
    { x: 22, y: 22 },
    { x: 72, y: 20 },
    { x: 38, y: 36 },
    { x: 65, y: 34 },
    // Act II (6-12): middle cluster, spread wider
    { x: 12, y: 48 },
    { x: 45, y: 50 },
    { x: 82, y: 46 },
    { x: 28, y: 62 },
    { x: 58, y: 64 },
    { x: 88, y: 60 },
    { x: 15, y: 74 },
    // Act III (13-15): bottom cluster
    { x: 35, y: 86 },
    { x: 58, y: 90 },
    { x: 78, y: 84 },
  ];
  return base.map((p) => ({
    x: p.x + (rng() - 0.5) * 8,
    y: p.y + (rng() - 0.5) * 5,
  }));
}

const NODE_POSITIONS = generateNodePositions();

// Narrative connections with strength (0-1)
const CONNECTIONS: { from: number; to: number; strength: number }[] = [
  { from: 0, to: 1, strength: 0.9 },
  { from: 0, to: 2, strength: 0.9 },
  { from: 1, to: 3, strength: 0.7 },
  { from: 2, to: 4, strength: 0.7 },
  { from: 1, to: 4, strength: 0.4 },
  { from: 2, to: 3, strength: 0.3 },
  { from: 3, to: 5, strength: 0.8 },
  { from: 4, to: 6, strength: 0.8 },
  { from: 3, to: 6, strength: 0.3 },
  { from: 4, to: 7, strength: 0.6 },
  { from: 5, to: 8, strength: 0.7 },
  { from: 6, to: 9, strength: 0.7 },
  { from: 5, to: 11, strength: 0.5 },
  { from: 7, to: 10, strength: 0.6 },
  { from: 7, to: 9, strength: 0.4 },
  { from: 8, to: 11, strength: 0.6 },
  { from: 9, to: 12, strength: 0.8 },
  { from: 10, to: 14, strength: 0.7 },
  { from: 11, to: 12, strength: 0.5 },
  { from: 12, to: 13, strength: 0.9 },
  { from: 13, to: 14, strength: 0.9 },
];

function getToneColor(toneScore: number): string {
  if (toneScore >= 8) return "#991b1b";
  if (toneScore >= 5) return "#c4923a";
  return "#2563eb";
}

function getGlowClass(toneScore: number): string {
  if (toneScore >= 8) return "uxpm-glow-red";
  if (toneScore >= 5) return "uxpm-glow-amber";
  return "uxpm-glow-blue";
}

function bezierPath(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): string {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  // Offset the control point perpendicular to the line
  const cx = (p1.x + p2.x) / 2 - dy * 0.15;
  const cy = (p1.y + p2.y) / 2 + dx * 0.1;
  return `M ${p1.x} ${p1.y} Q ${cx} ${cy} ${p2.x} ${p2.y}`;
}

function MemoryMapInner({
  fragments,
  currentId,
  onSelect,
  newlyUnlockedId,
}: MemoryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  // Touch/hover state
  const [touchedNode, setTouchedNode] = useState<number | null>(null);
  const [discoveryWave, setDiscoveryWave] = useState<number | null>(null);

  const unlockedIds = useMemo(
    () => new Set(fragments.filter((f) => f.unlocked).map((f) => f.id)),
    [fragments]
  );

  // Trigger discovery wave when a new fragment unlocks
  useEffect(() => {
    if (newlyUnlockedId && newlyUnlockedId > 0) {
      setDiscoveryWave(newlyUnlockedId);
      const timer = setTimeout(() => setDiscoveryWave(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [newlyUnlockedId]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.6, Math.min(2.5, prev - e.deltaY * 0.001)));
  }, []);

  // Pan via mouse drag (desktop)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("button")) return;
      isPanning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [pan]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  // Node interaction
  const handleNodePress = useCallback(
    (fragmentId: number, unlocked: boolean) => {
      if (!unlocked) return;
      // On mobile: first tap shows preview, second tap opens
      if (touchedNode === fragmentId) {
        onSelect(fragmentId);
        setTouchedNode(null);
      } else {
        setTouchedNode(fragmentId);
      }
    },
    [touchedNode, onSelect]
  );

  // Click outside nodes clears touch
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("button")) {
        setTouchedNode(null);
      }
    },
    []
  );

  const currentAct = currentId <= 5 ? 1 : currentId <= 12 ? 2 : 3;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] sm:min-h-[400px] overflow-hidden select-none"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleContainerClick}
      style={{ touchAction: "none" }}
    >
      {/* Transformed container */}
      <div
        className="absolute inset-0 transition-transform duration-100"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          willChange: "transform",
        }}
      >
        {/* SVG bezier connections */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Connection glow filter */}
          <defs>
            <filter id="conn-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {CONNECTIONS.map((conn, i) => {
            const p1 = NODE_POSITIONS[conn.from];
            const p2 = NODE_POSITIONS[conn.to];
            const bothUnlocked =
              unlockedIds.has(conn.from + 1) && unlockedIds.has(conn.to + 1);
            const d = bezierPath(p1, p2);

            return (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke={bothUnlocked ? "#c4923a" : "#1a1a1a"}
                strokeWidth={
                  bothUnlocked
                    ? 0.3 + conn.strength * 0.6
                    : 0.15 + conn.strength * 0.15
                }
                strokeOpacity={bothUnlocked ? 0.3 + conn.strength * 0.4 : 0.15}
                strokeLinecap="round"
                filter={bothUnlocked ? "url(#conn-glow)" : undefined}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: i * 0.06, duration: 0.8, ease: "easeOut" }}
              />
            );
          })}

          {/* Discovery wave effect */}
          {discoveryWave && (
            <motion.circle
              cx={NODE_POSITIONS[discoveryWave - 1]?.x ?? 50}
              cy={NODE_POSITIONS[discoveryWave - 1]?.y ?? 50}
              r={0}
              fill="none"
              stroke="#c4923a"
              strokeWidth={0.3}
              initial={{ r: 0, opacity: 0.8 }}
              animate={{ r: 25, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          )}
        </svg>

        {/* Nodes */}
        {NODE_POSITIONS.map((pos, i) => {
          const fragmentId = i + 1;
          const fragment = fragments.find((f) => f.id === fragmentId);
          const unlocked = !!fragment?.unlocked;
          const isCurrent = fragmentId === currentId;
          const isTouched = touchedNode === fragmentId;
          const act = fragmentId <= 5 ? 1 : fragmentId <= 12 ? 2 : 3;
          const isCurrentAct = act === currentAct;
          const toneColor = fragment
            ? getToneColor(fragment.toneScore)
            : "#2a2a2a";

          // Size logic: mobile larger for touch, desktop smaller
          const sizePx = isCurrent ? 40 : isTouched ? 44 : 32;
          const sizeMobile = isCurrent ? 44 : isTouched ? 48 : 36;

          return (
            <motion.button
              key={fragmentId}
              onClick={() => handleNodePress(fragmentId, unlocked)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: unlocked ? 1 : isCurrentAct ? 0.35 : 0.15,
              }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 200 }}
              className={`
                absolute rounded-full border-2 flex items-center justify-center
                font-body uxpm-press uxpm-tap-highlight transition-all duration-200
                ${isCurrent ? `${getGlowClass(fragment?.toneScore ?? 5)}` : ""}
                ${
                  unlocked && !isCurrent
                    ? "hover:brightness-125 active:scale-95"
                    : ""
                }
              `}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `clamp(${sizeMobile}px, 4vw, ${sizePx}px)`,
                height: `clamp(${sizeMobile}px, 4vw, ${sizePx}px)`,
                marginLeft: `clamp(-${sizeMobile / 2}px, -2vw, -${sizePx / 2}px)`,
                marginTop: `clamp(-${sizeMobile / 2}px, -2vw, -${sizePx / 2}px)`,
                borderColor: unlocked ? toneColor : "rgba(42,42,42,0.4)",
                backgroundColor: unlocked
                  ? isCurrent
                    ? `${toneColor}50`
                    : `${toneColor}20`
                  : "rgba(10,10,10,0.8)",
                boxShadow: isCurrent
                  ? `0 0 12px ${toneColor}60, 0 0 24px ${toneColor}20`
                  : "none",
                filter: unlocked ? "none" : "blur(1px)",
                fontSize: isCurrent ? 12 : 10,
              }}
              disabled={!unlocked}
              data-locked={!unlocked || undefined}
            >
              {/* Content */}
              {unlocked ? (
                <span style={{ color: toneColor }}>{fragmentId}</span>
              ) : (
                <span className="text-[8px] opacity-60">&#128274;</span>
              )}

              {/* Pulse ring on current */}
              {isCurrent && (
                <motion.span
                  className="absolute inset-0 rounded-full border"
                  style={{ borderColor: toneColor }}
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              {/* Act label */}
              {(fragmentId === 1 || fragmentId === 6 || fragmentId === 13) && (
                <span
                  className="absolute -top-5 text-[7px] font-body whitespace-nowrap tracking-wider"
                  style={{
                    color: isCurrentAct ? toneColor : "rgba(100,100,100,0.3)",
                  }}
                >
                  {act === 1 ? "ACTO I" : act === 2 ? "ACTO II" : "ACTO III"}
                </span>
              )}

              {/* Mobile touch tooltip */}
              <AnimatePresence>
                {isTouched && fragment && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute z-[100] pointer-events-none uxpm-glass p-3 shadow-xl"
                    style={{
                      width: 200,
                      left: pos.x > 60 ? "auto" : "120%",
                      right: pos.x > 60 ? "120%" : "auto",
                      top: "50%",
                      transform: "translateY(-50%)",
                      borderLeft: `2px solid ${toneColor}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] font-body text-noir-muted">
                        #{String(fragmentId).padStart(2, "0")}
                      </span>
                      <span
                        className="text-[9px] font-mono"
                        style={{ color: toneColor }}
                      >
                        {fragment.toneScore}/10
                      </span>
                    </div>
                    <p className="font-display text-[10px] text-noir-text/80 leading-relaxed line-clamp-3">
                      {fragment.text.slice(0, 90)}...
                    </p>
                    <p className="text-[8px] font-body text-noir-muted/50 mt-1.5">
                      Toca de nuevo para abrir
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Zoom controls (desktop) */}
      <div className="absolute bottom-2 left-2 hidden sm:flex flex-col gap-1 z-20">
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
          className="w-6 h-6 uxpm-glass text-noir-muted hover:text-noir-accent text-xs flex items-center justify-center uxpm-press"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
          className="w-6 h-6 uxpm-glass text-noir-muted hover:text-noir-accent text-xs flex items-center justify-center uxpm-press"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="w-6 h-6 uxpm-glass text-noir-muted hover:text-noir-accent text-[8px] flex items-center justify-center uxpm-press"
          title="Reset"
        >
          ⟳
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 text-[8px] sm:text-[9px] font-body text-noir-muted/60 z-20">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-noir-accent/60 border border-noir-accent" />
          <span className="hidden sm:inline">activo</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-noir-bg border border-noir-border opacity-40 blur-[0.5px]" />
          <span className="hidden sm:inline">bloqueado</span>
        </div>
        <span className="hidden md:inline text-noir-muted/30">
          scroll: zoom &middot; drag: mover
        </span>
      </div>
    </div>
  );
}

const MemoryMap = memo(MemoryMapInner, (prev, next) => {
  return (
    prev.fragments.length === next.fragments.length &&
    prev.currentId === next.currentId &&
    prev.newlyUnlockedId === next.newlyUnlockedId
  );
});

export default MemoryMap;
