"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";
import type { GalleryEntry } from "@/lib/types";

const IDENTITY_COLORS = { arquitecto: "#b42828", testigo: "#c4923a", espejo: "#7c3aed" };
const IDENTITY_NAMES = { arquitecto: "El Arquitecto", testigo: "El Testigo", espejo: "El Espejo" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "hace un momento";
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

export default function GalleryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<GalleryEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/gallery?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => { setEntries(d.entries || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor />
      <ScanlineOverlay />

      <header className="flex items-center justify-between p-4 border-b border-noir-border/20 relative z-50">
        <button onClick={() => router.push("/")}
          className="font-display text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent transition-colors">
          <GlitchText text="MONGLI" intensity="low" />
        </button>
        <span className="font-body text-[10px] text-noir-muted">/ archivo</span>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <div className="text-center mb-8">
          <p className="text-[8px] font-body text-noir-muted/40 uppercase tracking-[0.4em] mb-1">Archivo público</p>
          <h1 className="font-display text-xl sm:text-2xl text-noir-accent tracking-wider mb-1">
            ARCHIVO DE IDENTIDADES
          </h1>
          <p className="font-body text-xs text-noir-muted">Los que despertaron antes que tú</p>
          <p className="font-mono text-[9px] text-noir-accent/50 mt-2">{entries.length} identidades reveladas en 0G</p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {[
            { key: "all", label: "Todos" },
            { key: "arquitecto", label: "Arquitecto", color: "#b42828" },
            { key: "testigo", label: "Testigo", color: "#c4923a" },
            { key: "espejo", label: "Espejo", color: "#7c3aed" },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-[10px] font-body border transition-colors uxpm-press ${
                filter === f.key
                  ? "border-noir-accent text-noir-accent bg-noir-accent/10"
                  : "border-noir-border/40 text-noir-muted hover:text-noir-accent"
              }`}
              style={filter === f.key && f.color ? { borderColor: `${f.color}60`, color: f.color } : undefined}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border border-noir-accent/40 border-t-noir-accent rounded-full mx-auto mb-4" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-display text-sm text-noir-muted mb-4">Nadie ha despertado aún. Sé el primero.</p>
            <motion.button onClick={() => router.push("/")} whileHover={{ scale: 1.05 }}
              className="px-6 py-2.5 border-2 border-noir-accent text-noir-accent font-display text-xs tracking-wider uxpm-press">
              Comenzar tu historia
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {entries.map((entry, i) => {
              const color = IDENTITY_COLORS[entry.identity] || "#c4923a";
              const name = IDENTITY_NAMES[entry.identity] || "Desconocido";
              const darkPct = entry.totalDecisions > 0 ? Math.round((entry.darkDecisions / entry.totalDecisions) * 100) : 50;

              return (
                <motion.div key={`${entry.walletAddress}-${i}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="manila-folder p-4 group hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[9px] text-noir-muted/40">
                      {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                    </span>
                    <span className="text-[8px] text-noir-muted/30">{timeAgo(entry.completedAt)}</span>
                  </div>

                  <h3 className="font-display text-sm mb-2" style={{ color }}>{name}</h3>

                  {/* Tone bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-body text-noir-muted/40">tono</span>
                    <div className="flex-1 h-[3px] bg-noir-border/20">
                      <div className="h-full" style={{ width: `${(entry.toneAverage / 10) * 100}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-[8px] font-mono" style={{ color }}>{entry.toneAverage.toFixed(1)}</span>
                  </div>

                  <p className="text-[9px] font-body text-noir-muted/50">{darkPct}% sombra</p>

                  {/* Hover reveal */}
                  <div className="max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-300">
                    <p className="font-display text-[10px] text-noir-text/50 mt-2 italic leading-relaxed">
                      {entry.shareText}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
