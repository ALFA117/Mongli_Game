"use client";

import { useEffect, useState, useRef } from "react";

export default function ScanlineOverlay() {
  const [crtFlicker, setCrtFlicker] = useState(false);
  const flickerTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const scheduleFlicker = () => {
      const delay = 8000 + Math.random() * 7000;
      flickerTimeout.current = setTimeout(() => {
        setCrtFlicker(true);
        setTimeout(() => setCrtFlicker(false), 150 + Math.random() * 200);
        scheduleFlicker();
      }, delay);
    };
    scheduleFlicker();
    return () => {
      if (flickerTimeout.current) clearTimeout(flickerTimeout.current);
    };
  }, []);

  return (
    <>
      {/* SVG filter definitions for chromatic aberration */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="chromatic-aberration">
            <feOffset in="SourceGraphic" dx="1" dy="0" result="red-shifted">
              <animate
                attributeName="dx"
                values="1;2;0.5;1"
                dur="10s"
                repeatCount="indefinite"
              />
            </feOffset>
            <feColorMatrix
              in="red-shifted"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.15 0"
              result="red-channel"
            />
            <feOffset in="SourceGraphic" dx="-1" dy="0" result="cyan-shifted">
              <animate
                attributeName="dx"
                values="-1;-1.5;-0.5;-1"
                dur="8s"
                repeatCount="indefinite"
              />
            </feOffset>
            <feColorMatrix
              in="cyan-shifted"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.12 0"
              result="cyan-channel"
            />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="red-channel" />
              <feMergeNode in="cyan-channel" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Scanlines with phosphor glow */}
      <div
        className="fixed inset-0 pointer-events-none z-[9996]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(232, 213, 176, 0.03) 2px,
              rgba(232, 213, 176, 0.06) 3px,
              rgba(232, 213, 176, 0.03) 4px
            )
          `,
          mixBlendMode: "screen",
        }}
      />

      {/* Phosphor glow — green/amber tint on bright areas */}
      <div
        className="fixed inset-0 pointer-events-none z-[9995]"
        style={{
          background: `
            radial-gradient(ellipse at 50% 40%, rgba(196,146,58,0.015) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(100,180,80,0.008) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 20%, rgba(196,146,58,0.01) 0%, transparent 40%)
          `,
          animation: "phosphorPulse 6s ease-in-out infinite",
        }}
      />

      {/* CRT random flicker — entire screen brightness drop */}
      <div
        className="fixed inset-0 pointer-events-none z-[9994] transition-opacity"
        style={{
          backgroundColor: "rgba(255,255,255,0.04)",
          opacity: crtFlicker ? 1 : 0,
          transitionDuration: crtFlicker ? "0ms" : "200ms",
        }}
      />

      {/* Chromatic aberration on edges */}
      <div
        className="fixed inset-0 pointer-events-none z-[9993]"
        style={{
          boxShadow: `
            inset 2px 0 8px rgba(255, 50, 50, 0.03),
            inset -2px 0 8px rgba(50, 200, 255, 0.03),
            inset 0 2px 8px rgba(255, 50, 50, 0.02),
            inset 0 -2px 8px rgba(50, 200, 255, 0.02)
          `,
        }}
      />

      {/* Animated vignette with slow pulse */}
      <div
        className="fixed inset-0 pointer-events-none z-[9992]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 75%, rgba(0,0,0,0.85) 100%)",
          animation: "vignettePulse 8s ease-in-out infinite",
        }}
      />

      {/* Horizontal scan beam — a bright line that sweeps down periodically */}
      <div
        className="fixed left-0 right-0 pointer-events-none z-[9996] h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(232,213,176,0.06) 20%, rgba(232,213,176,0.1) 50%, rgba(232,213,176,0.06) 80%, transparent 100%)",
          animation: "scanBeam 12s linear infinite",
        }}
      />

      <style jsx>{`
        @keyframes phosphorPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes vignettePulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
        @keyframes scanBeam {
          0% { top: -2px; }
          100% { top: 100vh; }
        }
      `}</style>
    </>
  );
}
