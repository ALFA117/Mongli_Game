"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

type SceneType = "hotel" | "alley" | "office" | "void" | "archive";

interface Skull3DProps {
  className?: string;
  scene?: SceneType;
  onSkullClick?: () => void;
}

const SCENES = {
  hotel:  { eye: "#d4a244", glow: "rgba(212,162,68,0.5)", bone: "#d4a244", bg: "rgba(212,162,68,0.04)" },
  alley:  { eye: "#4080d0", glow: "rgba(64,128,208,0.5)", bone: "#6090c0", bg: "rgba(64,128,208,0.03)" },
  office: { eye: "#00ff41", glow: "rgba(0,255,65,0.4)",   bone: "#30b030", bg: "rgba(0,255,65,0.02)" },
  void:   { eye: "#ffffff", glow: "rgba(255,255,255,0.3)", bone: "#888888", bg: "transparent" },
  archive:{ eye: "#d4a244", glow: "rgba(212,162,68,0.4)", bone: "#c4a070", bg: "rgba(196,160,112,0.03)" },
};

// ─── The skull SVG (shared across all layers) ───
function SkullPath({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return (
    <svg viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ opacity }}>
      {/* Cranium */}
      <path d="M100 15 C52 15, 20 55, 20 95 C20 125, 30 145, 44 158 L44 166 C44 172, 50 176, 58 178 L68 180 L68 188 C68 194, 74 198, 84 198 L116 198 C126 198, 132 194, 132 188 L132 180 L142 178 C150 176, 156 172, 156 166 L156 158 C170 145, 180 125, 180 95 C180 55, 148 15, 100 15Z" stroke={color} strokeWidth="2" fill="none" />
      {/* Cranium suture lines */}
      <path d="M58 50 Q100 42, 142 50" stroke={color} strokeWidth="0.6" opacity="0.25" />
      <path d="M100 15 Q102 35, 100 50" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <path d="M70 45 Q65 70, 55 85" stroke={color} strokeWidth="0.4" opacity="0.15" />
      <path d="M130 45 Q135 70, 145 85" stroke={color} strokeWidth="0.4" opacity="0.15" />
      {/* Brow ridge */}
      <path d="M42 98 Q58 82, 80 90" stroke={color} strokeWidth="1.8" opacity="0.5" />
      <path d="M120 90 Q142 82, 158 98" stroke={color} strokeWidth="1.8" opacity="0.5" />
      {/* Cheekbones */}
      <path d="M48 118 Q56 130, 52 148" stroke={color} strokeWidth="1.2" opacity="0.4" />
      <path d="M152 118 Q144 130, 148 148" stroke={color} strokeWidth="1.2" opacity="0.4" />
      {/* Zygomatic arch */}
      <path d="M32 95 Q28 112, 36 130" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <path d="M168 95 Q172 112, 164 130" stroke={color} strokeWidth="0.8" opacity="0.3" />
      {/* Temporal */}
      <path d="M28 78 Q24 95, 28 115" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <path d="M172 78 Q176 95, 172 115" stroke={color} strokeWidth="0.5" opacity="0.2" />
      {/* Nose cavity */}
      <path d="M93 128 L100 146 L107 128 Z" stroke={color} strokeWidth="1.5" fill="none" />
      <path d="M97 128 L100 118" stroke={color} strokeWidth="0.7" opacity="0.3" />
      <path d="M103 128 L100 118" stroke={color} strokeWidth="0.7" opacity="0.3" />
      {/* Jaw / mandible */}
      <path d="M56 162 Q58 186, 84 198 L116 198 Q142 186, 144 162" stroke={color} strokeWidth="1" opacity="0.35" />
      {/* Upper teeth */}
      {[-3,-2,-1,0,1,2,3].map(i => <rect key={`u${i}`} x={74+i*7.5} y={160} width={6} height={11} rx={1} stroke={color} strokeWidth="0.8" fill="none" opacity="0.5" />)}
      {/* Lower teeth */}
      {[-2,-1,0,1,2].map(i => <rect key={`l${i}`} x={80+i*7.5} y={173} width={5.5} height={9} rx={1} stroke={color} strokeWidth="0.6" fill="none" opacity="0.35" />)}
    </svg>
  );
}

export default function Skull3D({ className = "", scene = "hotel", onSkullClick }: Skull3DProps) {
  const cfg = SCENES[scene];
  const containerRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef<number>(0);
  const [flash, setFlash] = useState(false);

  // Parallax with inertia via rAF
  useEffect(() => {
    const onMove = (cx: number, cy: number) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      rotRef.current.tx = ((cx - r.left - r.width / 2) / r.width) * 15;
      rotRef.current.ty = -((cy - r.top - r.height / 2) / r.height) * 12;
    };
    const mouseHandler = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const touchHandler = (e: TouchEvent) => { if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY); };

    const animate = () => {
      rotRef.current.x += (rotRef.current.tx - rotRef.current.x) * 0.08;
      rotRef.current.y += (rotRef.current.ty - rotRef.current.y) * 0.08;
      if (containerRef.current) {
        const inner = containerRef.current.querySelector("[data-skull-inner]") as HTMLElement;
        if (inner) {
          inner.style.transform = `rotateY(${rotRef.current.x}deg) rotateX(${rotRef.current.y}deg)`;
        }
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", mouseHandler);
    window.addEventListener("touchmove", touchHandler, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", mouseHandler);
      window.removeEventListener("touchmove", touchHandler);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    onSkullClick?.();
  }, [onSkullClick]);

  if (scene === "archive") {
    return (
      <div ref={containerRef} className={`relative ${className}`} style={{ perspective: 800 }}>
        <div data-skull-inner style={{ transformStyle: "preserve-3d", transition: "transform 0.1s" }}>
          {[
            { x: 0, y: 0, z: 0, s: 0.55 },
            { x: -35, y: -20, z: -30, s: 0.3 },
            { x: 30, y: 15, z: -50, s: 0.25 },
            { x: -25, y: 25, z: -70, s: 0.2 },
          ].map((pos, i) => (
            <motion.div
              key={i}
              className="absolute inset-0"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
              style={{
                transform: `translate(${pos.x}%, ${pos.y}%) translateZ(${pos.z}px) scale(${pos.s})`,
                opacity: i === 0 ? 0.9 : 0.35,
                filter: i > 0 ? "blur(0.5px)" : "none",
              }}
            >
              <SkullPath color={cfg.bone} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  const skullScale = scene === "void" ? 1.15 : 1;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ perspective: 800 }}
      onClick={handleClick}
    >
      {/* Breathing + 3D container */}
      <motion.div
        data-skull-inner
        animate={{ scale: [skullScale, skullScale * 1.03, skullScale] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {/* Layer 1: Deep shadow (far back) */}
        <div
          className="absolute inset-0"
          style={{
            transform: "translateZ(-40px) scale(1.05)",
            filter: "blur(12px)",
            opacity: 0.25,
          }}
        >
          <SkullPath color={cfg.bone} />
        </div>

        {/* Layer 2: Outer glow / contour (mid-back) */}
        <div
          className="absolute inset-0"
          style={{
            transform: "translateZ(-20px) scale(1.02)",
            filter: "blur(4px)",
            opacity: 0.4,
          }}
        >
          <SkullPath color={cfg.bone} />
        </div>

        {/* Layer 3: Main skull (center) */}
        <div className="relative" style={{ transform: "translateZ(0px)" }}>
          <SkullPath color={cfg.bone} />
        </div>

        {/* Layer 4: Bone detail lines (slightly forward) */}
        <div
          className="absolute inset-0"
          style={{ transform: "translateZ(10px)", opacity: 0.15 }}
        >
          <SkullPath color={cfg.bone} opacity={0.3} />
        </div>

        {/* Layer 5: Eye glow (forward) */}
        <div className="absolute inset-0" style={{ transform: "translateZ(20px)" }}>
          <svg viewBox="0 0 200 230" className="w-full h-full">
            <defs>
              <filter id="eye-glow-3d">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
            {/* Left eye glow */}
            <ellipse cx="72" cy="108" rx="14" ry="16" fill={cfg.eye} opacity="0.6" filter="url(#eye-glow-3d)" />
            <ellipse cx="72" cy="108" rx="6" ry="7" fill={cfg.eye} opacity="0.85" />
            <ellipse cx="72" cy="108" rx="2.5" ry="3" fill="#fff" opacity="0.7" />
            {/* Right eye glow */}
            <ellipse cx="128" cy="108" rx="14" ry="16" fill={cfg.eye} opacity="0.6" filter="url(#eye-glow-3d)" />
            <ellipse cx="128" cy="108" rx="6" ry="7" fill={cfg.eye} opacity="0.85" />
            <ellipse cx="128" cy="108" rx="2.5" ry="3" fill="#fff" opacity="0.7" />
            {/* Eye sockets dark */}
            <ellipse cx="72" cy="108" rx="18" ry="21" stroke={cfg.bone} strokeWidth="1.5" fill="#050505" opacity="0.7" />
            <ellipse cx="128" cy="108" rx="18" ry="21" stroke={cfg.bone} strokeWidth="1.5" fill="#050505" opacity="0.7" />
          </svg>
        </div>

        {/* Layer 6: Floating particles (more forward) */}
        <div className="absolute inset-0" style={{ transform: "translateZ(35px)" }}>
          {Array.from({ length: 10 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 2 + Math.random() * 2,
                height: 2 + Math.random() * 2,
                backgroundColor: cfg.eye,
                left: `${20 + Math.random() * 60}%`,
                top: `${15 + Math.random() * 70}%`,
              }}
              animate={{
                y: [0, -15 - Math.random() * 20, 0],
                opacity: [0.15, 0.4, 0.15],
              }}
              transition={{
                duration: 3 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Layer 7: Highlights / specular (closest) */}
        <div className="absolute inset-0" style={{ transform: "translateZ(50px)", opacity: 0.08 }}>
          <svg viewBox="0 0 200 230" className="w-full h-full">
            <ellipse cx="85" cy="55" rx="20" ry="12" fill="#fff" />
            <ellipse cx="130" cy="60" rx="12" ry="8" fill="#fff" />
          </svg>
        </div>
      </motion.div>

      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-full blur-[50px] scale-[1.3] -z-10"
        style={{ backgroundColor: cfg.bg }}
      />

      {/* Click flash */}
      {flash && (
        <div
          className="absolute inset-0 z-20 rounded-full transition-opacity duration-300"
          style={{ backgroundColor: "rgba(255,255,255,0.3)", opacity: flash ? 1 : 0 }}
        />
      )}
    </div>
  );
}
