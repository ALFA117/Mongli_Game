"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";

interface WorldData { totalActive: number; regions: { name: string; count: number }[]; lastActivityMinutesAgo: number }

const REGION_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  NA: { x: 22, y: 35, label: "América del Norte" },
  LATAM: { x: 28, y: 60, label: "América Latina" },
  EU: { x: 52, y: 30, label: "Europa" },
  ASIA: { x: 75, y: 35, label: "Asia" },
  OTHER: { x: 60, y: 65, label: "Otros" },
};

export default function WorldPage() {
  const router = useRouter();
  const [data, setData] = useState<WorldData | null>(null);

  const fetchData = () => fetch("/api/world").then(r => r.json()).then(setData).catch(() => {});

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, []);

  const maxCount = Math.max(...(data?.regions.map(r => r.count) || [1]), 1);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor /><ScanlineOverlay />
      <header className="flex items-center justify-between p-4 border-b border-noir-border/20 relative z-50">
        <button onClick={() => router.push("/")} className="font-display text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent"><GlitchText text="MONGLI" intensity="low" /></button>
        <span className="font-body text-[9px] text-noir-muted tracking-[0.3em] uppercase">Señales detectadas · Mongli Network</span>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-4 sm:p-8 gap-6 max-w-5xl mx-auto w-full">
        {/* Map */}
        <div className="lg:w-[70%] relative">
          <div className="aspect-[2/1] relative border border-noir-border/20 bg-noir-card/30 overflow-hidden">
            {/* Radar circles */}
            {[1, 2, 3].map(i => (
              <motion.div key={i} className="absolute rounded-full border border-noir-accent/10"
                style={{ left: "50%", top: "50%", width: `${i * 30}%`, height: `${i * 30}%`, transform: "translate(-50%, -50%)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }} />
            ))}

            {/* Simplified world outline */}
            <svg viewBox="0 0 100 50" className="absolute inset-0 w-full h-full opacity-10">
              <path d="M15 20 Q20 15, 30 18 Q35 20, 30 25 Q28 30, 25 35 L20 40 Q15 35, 15 30 Z" stroke="#d4a244" fill="none" strokeWidth="0.3" />
              <path d="M40 15 Q50 12, 60 15 Q65 18, 62 25 Q58 28, 55 25 Q50 20, 45 22 Q42 20, 40 15 Z" stroke="#d4a244" fill="none" strokeWidth="0.3" />
              <path d="M65 18 Q75 15, 85 20 Q88 25, 85 30 Q80 32, 75 28 Q70 25, 65 22 Z" stroke="#d4a244" fill="none" strokeWidth="0.3" />
            </svg>

            {/* Activity dots */}
            {data?.regions.map(r => {
              const pos = REGION_POSITIONS[r.name];
              if (!pos) return null;
              const size = 8 + (r.count / maxCount) * 16;
              return (
                <motion.div key={r.name} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 2, repeat: Infinity, delay: Math.random() }}>
                  <div className="rounded-full bg-noir-accent" style={{ width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, boxShadow: `0 0 ${size}px rgba(212,162,68,0.5)` }} />
                  <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 font-mono text-[8px] text-noir-accent/60 whitespace-nowrap">{pos.label} ({r.count})</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="lg:w-[30%] space-y-6">
          <div className="manila-folder p-4 text-center">
            <p className="font-display text-3xl text-noir-accent">{data?.totalActive || 0}</p>
            <p className="text-[9px] font-body text-noir-muted uppercase">jugadores activos</p>
          </div>

          {data && data.regions.length > 0 && (
            <div className="manila-folder p-4">
              <p className="text-[8px] font-body text-noir-muted uppercase tracking-wider mb-3">Regiones</p>
              {data.regions.slice(0, 5).map(r => (
                <div key={r.name} className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[9px] text-noir-text/60 w-12">{REGION_POSITIONS[r.name]?.label.slice(0, 6) || r.name}</span>
                  <div className="flex-1 h-[4px] bg-noir-border/20"><div className="h-full bg-noir-accent/60" style={{ width: `${(r.count / maxCount) * 100}%` }} /></div>
                  <span className="font-mono text-[8px] text-noir-muted">{r.count}</span>
                </div>
              ))}
            </div>
          )}

          <div className="text-center">
            <p className="font-body text-[9px] text-noir-muted/40">Última actividad: hace {data?.lastActivityMinutesAgo || 0}m</p>
          </div>
        </div>
      </main>
    </div>
  );
}
