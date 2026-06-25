"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";

type SceneType = "hotel" | "alley" | "office" | "void" | "archive";

interface Skull3DProps {
  className?: string;
  scene?: SceneType;
  onSkullClick?: () => void;
}

const SCENE_CONFIG = {
  hotel: { color: "#d4a244", glow: "rgba(212,162,68,0.4)", eyeColor: "#d4a244", bg: "rgba(212,162,68,0.03)" },
  alley: { color: "#6090c0", glow: "rgba(96,144,192,0.4)", eyeColor: "#80b0e0", bg: "rgba(96,144,192,0.03)" },
  office: { color: "#40c040", glow: "rgba(64,192,64,0.3)", eyeColor: "#60ff60", bg: "rgba(64,192,64,0.02)" },
  void: { color: "#d4a244", glow: "rgba(212,162,68,0.2)", eyeColor: "#d4a244", bg: "transparent" },
  archive: { color: "#c4a070", glow: "rgba(196,160,112,0.3)", eyeColor: "#d4a244", bg: "rgba(196,160,112,0.02)" },
};

function SkullSVG({ color, eyeColor, glow }: { color: string; eyeColor: string; glow: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
        <filter id="skull-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="eye-glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="bone-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </radialGradient>
      </defs>

      {/* Cranium outline */}
      <path
        d="M100 12 C55 12, 22 50, 22 90 C22 120, 30 140, 42 152 L42 160 C42 165, 45 170, 55 172 L65 174 L65 180 C65 185, 70 190, 80 190 L120 190 C130 190, 135 185, 135 180 L135 174 L145 172 C155 170, 158 165, 158 160 L158 152 C170 140, 178 120, 178 90 C178 50, 145 12, 100 12Z"
        stroke={color}
        strokeWidth="1.8"
        fill="url(#bone-grad)"
        filter="url(#skull-glow)"
        strokeLinejoin="round"
      />

      {/* Cranium top detail lines */}
      <path d="M60 55 Q100 48, 140 55" stroke={color} strokeWidth="0.5" strokeOpacity="0.3" fill="none" />
      <path d="M100 12 L100 48" stroke={color} strokeWidth="0.4" strokeOpacity="0.2" />

      {/* Brow ridge */}
      <path
        d="M45 95 Q60 82, 78 88 M122 88 Q140 82, 155 95"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Left eye socket */}
      <ellipse cx="72" cy="105" rx="18" ry="20" stroke={color} strokeWidth="1.5" fill="#050505">
        <animate attributeName="ry" values="20;19;20" dur="4s" repeatCount="indefinite" />
      </ellipse>
      {/* Left eye glow */}
      <ellipse cx="72" cy="105" rx="8" ry="9" fill={eyeColor} opacity="0.7" filter="url(#eye-glow)">
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="72" cy="105" rx="3" ry="3.5" fill={eyeColor} opacity="0.9" />

      {/* Right eye socket */}
      <ellipse cx="128" cy="105" rx="18" ry="20" stroke={color} strokeWidth="1.5" fill="#050505">
        <animate attributeName="ry" values="20;19;20" dur="4s" repeatCount="indefinite" />
      </ellipse>
      {/* Right eye glow */}
      <ellipse cx="128" cy="105" rx="8" ry="9" fill={eyeColor} opacity="0.7" filter="url(#eye-glow)">
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx="128" cy="105" rx="3" ry="3.5" fill={eyeColor} opacity="0.9" />

      {/* Nasal cavity */}
      <path
        d="M95 125 L100 140 L105 125 Z"
        stroke={color}
        strokeWidth="1.2"
        fill="#080808"
        strokeLinejoin="round"
      />
      <line x1="100" y1="118" x2="100" y2="125" stroke={color} strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Cheekbones */}
      <path d="M50 115 Q58 125, 55 140" stroke={color} strokeWidth="1" strokeOpacity="0.5" fill="none" />
      <path d="M150 115 Q142 125, 145 140" stroke={color} strokeWidth="1" strokeOpacity="0.5" fill="none" />

      {/* Zygomatic arch */}
      <path d="M40 105 Q35 115, 42 130" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" />
      <path d="M160 105 Q165 115, 158 130" stroke={color} strokeWidth="0.8" strokeOpacity="0.3" fill="none" />

      {/* Upper teeth */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={`ut${i}`}
          x={72 + i * 7}
          y={155}
          width={5.5}
          height={10}
          rx={1}
          stroke={color}
          strokeWidth="0.8"
          fill="#0a0a0a"
          strokeOpacity="0.7"
        />
      ))}

      {/* Lower teeth */}
      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={`lt${i}`}
          x={78 + i * 7}
          y={167}
          width={5}
          height={8}
          rx={1}
          stroke={color}
          strokeWidth="0.6"
          fill="#0a0a0a"
          strokeOpacity="0.5"
        />
      ))}

      {/* Jaw line / mandible */}
      <path
        d="M55 155 Q55 178, 80 190 L120 190 Q145 178, 145 155"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.4"
        fill="none"
      />

      {/* Temporal bone details */}
      <path d="M30 80 Q25 100, 30 120" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" fill="none" />
      <path d="M170 80 Q175 100, 170 120" stroke={color} strokeWidth="0.5" strokeOpacity="0.25" fill="none" />
    </svg>
  );
}

export default function Skull3D({ className = "", scene = "hotel", onSkullClick }: Skull3DProps) {
  const config = SCENE_CONFIG[scene];
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      setMouseOffset({
        x: ((e.clientX - cx) / rect.width) * 12,
        y: ((e.clientY - cy) / rect.height) * 8,
      });
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  const handleClick = useCallback(() => { onSkullClick?.(); }, [onSkullClick]);

  return (
    <div ref={containerRef} className={`relative ${className}`} onClick={handleClick}>
      {/* Background glow */}
      <div
        className="absolute inset-0 rounded-full blur-[60px] scale-[1.3]"
        style={{ backgroundColor: config.bg }}
      />

      {/* Animated skull */}
      <motion.div
        animate={{
          y: [0, -6, 0],
          rotateX: mouseOffset.y * 0.3,
          rotateY: mouseOffset.x * 0.5,
        }}
        transition={{
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotateX: { duration: 0.3 },
          rotateY: { duration: 0.3 },
        }}
        style={{
          perspective: 800,
          filter: `drop-shadow(0 0 20px ${config.glow})`,
        }}
        className="w-full h-full"
      >
        <SkullSVG color={config.color} eyeColor={config.eyeColor} glow={config.glow} />
      </motion.div>

      {/* Floating particles */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            backgroundColor: config.color,
            opacity: 0.2 + Math.random() * 0.2,
            left: `${15 + Math.random() * 70}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -20 - Math.random() * 30, 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
