"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";

type SceneType = "hotel" | "alley" | "office" | "void" | "archive";

interface Skull3DProps {
  scene?: SceneType;
  className?: string;
  onSkullClick?: () => void;
}

const EYE_CONFIG: Record<SceneType, { color: string; glowOpacity: number; flicker: boolean }> = {
  hotel: { color: "#E5483D", glowOpacity: 0.6, flicker: false },
  alley: { color: "#E5483D", glowOpacity: 0.7, flicker: true },
  office: { color: "#00ff41", glowOpacity: 0.8, flicker: false },
  void: { color: "#E5483D", glowOpacity: 0.85, flicker: false },
  archive: { color: "#E5483D", glowOpacity: 0.4, flicker: false },
};

export default function Skull3D({ scene = "hotel", className = "", onSkullClick }: Skull3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef(0);
  const [flash, setFlash] = useState(false);
  const cfg = EYE_CONFIG[scene];

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      rotRef.current.tx = ((e.clientX - r.left - r.width / 2) / r.width) * 8;
      rotRef.current.ty = -((e.clientY - r.top - r.height / 2) / r.height) * 6;
    };
    const animate = () => {
      rotRef.current.x += (rotRef.current.tx - rotRef.current.x) * 0.06;
      rotRef.current.y += (rotRef.current.ty - rotRef.current.y) * 0.06;
      if (containerRef.current) {
        const inner = containerRef.current.querySelector("[data-skull]") as HTMLElement;
        if (inner) inner.style.transform = `rotateY(${rotRef.current.x}deg) rotateX(${rotRef.current.y}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafRef.current); };
  }, []);

  const handleClick = useCallback(() => {
    setFlash(true); setTimeout(() => setFlash(false), 300);
    onSkullClick?.();
  }, [onSkullClick]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ perspective: 800 }} onClick={handleClick}>
      <motion.div data-skull
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" as const }}
      >
        <svg viewBox="0 0 200 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <filter id="eye-glow"><feGaussianBlur stdDeviation="4" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <radialGradient id="bone-fill" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ECE8E1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ECE8E1" stopOpacity="0.02" />
            </radialGradient>
          </defs>

          {/* Cranium */}
          <path d="M100 15 C52 15, 20 55, 20 95 C20 125, 30 145, 44 158 L44 166 C44 172, 50 176, 58 178 L68 180 L68 188 C68 194, 74 198, 84 198 L116 198 C126 198, 132 194, 132 188 L132 180 L142 178 C150 176, 156 172, 156 166 L156 158 C170 145, 180 125, 180 95 C180 55, 148 15, 100 15Z"
            stroke="#ECE8E1" strokeWidth="1.8" fill="url(#bone-fill)" />

          {/* Cracks */}
          <path d="M80 30 L85 50 L78 65" stroke="#A29C92" strokeWidth="0.6" opacity="0.5" />
          <path d="M120 25 L118 48 L125 60" stroke="#A29C92" strokeWidth="0.5" opacity="0.4" />
          <path d="M60 55 L70 60 L65 75" stroke="#A29C92" strokeWidth="0.4" opacity="0.3" />

          {/* Sutures */}
          <path d="M58 50 Q100 42, 142 50" stroke="#A29C92" strokeWidth="0.5" opacity="0.25" />
          <path d="M100 15 Q102 35, 100 50" stroke="#A29C92" strokeWidth="0.4" opacity="0.2" />

          {/* Brow ridge */}
          <path d="M42 98 Q58 82, 80 90" stroke="#ECE8E1" strokeWidth="1.5" opacity="0.5" />
          <path d="M120 90 Q142 82, 158 98" stroke="#ECE8E1" strokeWidth="1.5" opacity="0.5" />

          {/* Eye sockets */}
          <ellipse cx="72" cy="108" rx="18" ry="21" stroke="#ECE8E1" strokeWidth="1.5" fill="#050505" />
          <ellipse cx="128" cy="108" rx="18" ry="21" stroke="#ECE8E1" strokeWidth="1.5" fill="#050505" />

          {/* Eye glow */}
          <ellipse cx="72" cy="108" rx="10" ry="12" fill={cfg.color} opacity={flash ? 1 : cfg.glowOpacity} filter="url(#eye-glow)">
            {cfg.flicker && <animate attributeName="opacity" values={`${cfg.glowOpacity};0.3;${cfg.glowOpacity}`} dur="1.5s" repeatCount="indefinite" />}
            {!cfg.flicker && <animate attributeName="opacity" values={`${cfg.glowOpacity};${cfg.glowOpacity * 0.6};${cfg.glowOpacity}`} dur="2s" repeatCount="indefinite" />}
          </ellipse>
          <ellipse cx="72" cy="108" rx="3" ry="4" fill="#fff" opacity="0.6" />

          <ellipse cx="128" cy="108" rx="10" ry="12" fill={cfg.color} opacity={flash ? 1 : cfg.glowOpacity} filter="url(#eye-glow)">
            {cfg.flicker && <animate attributeName="opacity" values={`${cfg.glowOpacity};0.3;${cfg.glowOpacity}`} dur="1.2s" repeatCount="indefinite" />}
            {!cfg.flicker && <animate attributeName="opacity" values={`${cfg.glowOpacity};${cfg.glowOpacity * 0.6};${cfg.glowOpacity}`} dur="2s" repeatCount="indefinite" />}
          </ellipse>
          <ellipse cx="128" cy="108" rx="3" ry="4" fill="#fff" opacity="0.6" />

          {/* Nose */}
          <path d="M93 128 L100 146 L107 128 Z" stroke="#ECE8E1" strokeWidth="1.2" fill="#080808" />

          {/* Cheekbones */}
          <path d="M48 118 Q56 130, 52 148" stroke="#A29C92" strokeWidth="1" opacity="0.4" />
          <path d="M152 118 Q144 130, 148 148" stroke="#A29C92" strokeWidth="1" opacity="0.4" />

          {/* Teeth with shadow */}
          {[-3,-2,-1,0,1,2,3].map(i => (
            <g key={`t${i}`}>
              <rect x={74+i*7.5} y={160} width={6} height={11} rx={1} stroke="#ECE8E1" strokeWidth="0.8" fill="#0a0a0a" />
              <rect x={74+i*7.5+1} y={161} width={4} height={2} fill="#A29C92" opacity="0.15" />
            </g>
          ))}

          {/* Jaw */}
          <path d="M56 162 Q58 186, 84 198 L116 198 Q142 186, 144 162" stroke="#ECE8E1" strokeWidth="1" opacity="0.35" />
        </svg>
      </motion.div>

    </div>
  );
}
