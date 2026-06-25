"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";
import type { Fragment } from "@/lib/types";
import { buildPlayerProfile } from "@/lib/types";
import { ACHIEVEMENTS } from "@/components/Achievements";
import type { AchievementMeta } from "@/components/Achievements";

interface PlayerStatsProps {
  fragments: Fragment[];
  achievementMeta: AchievementMeta;
  visible: boolean;
  onClose: () => void;
}

const PROFILE_NAMES: Record<string, string[]> = {
  shadow: [
    "El Arquitecto Silencioso",
    "La Sombra Persistente",
    "El Observador Oscuro",
    "El Que Recuerda Demasiado",
  ],
  light: [
    "El Testigo Reluctante",
    "El Buscador de Grietas",
    "La Voz Silenciada",
    "El Que Elige Ver",
  ],
  balanced: [
    "El Espejo Dual",
    "El Equilibrista Moral",
    "La Paradoja Consciente",
    "El Que Camina Entre",
  ],
};

function getProfileName(tendency: string, fragmentCount: number): string {
  const pool = PROFILE_NAMES[tendency] || PROFILE_NAMES.balanced;
  return pool[fragmentCount % pool.length];
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hace un momento";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h / 24)}d`;
}

function ToneGauge({ value }: { value: number }) {
  const angle = -90 + (value / 10) * 180;
  const needleColor = value >= 7 ? "#dc2626" : value >= 4 ? "#c4923a" : "#3b82f6";

  return (
    <svg viewBox="0 0 100 60" className="w-full max-w-[160px]">
      {/* Arc background */}
      <path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke="#1a1a1a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Colored arc */}
      <defs>
        <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#c4923a" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke="url(#gauge-grad)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />
      {/* Needle */}
      <motion.line
        x1="50"
        y1="55"
        x2="50"
        y2="20"
        stroke={needleColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        style={{ transformOrigin: "50px 55px" }}
        initial={{ rotate: -90 }}
        animate={{ rotate: angle }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
      />
      {/* Center dot */}
      <circle cx="50" cy="55" r="3" fill={needleColor} />
      {/* Labels */}
      <text x="8" y="58" fontSize="5" fill="#3b82f6" fontFamily="monospace">0</text>
      <text x="47" y="12" fontSize="5" fill="#c4923a" fontFamily="monospace">5</text>
      <text x="86" y="58" fontSize="5" fill="#dc2626" fontFamily="monospace">10</text>
    </svg>
  );
}

export default function PlayerStats({
  fragments,
  achievementMeta,
  visible,
  onClose,
}: PlayerStatsProps) {
  const profile = buildPlayerProfile(fragments);
  const profileName = getProfileName(profile.tendency, fragments.length);

  const avgTone = useMemo(
    () =>
      fragments.length > 0
        ? fragments.reduce((s, f) => s + f.toneScore, 0) / fragments.length
        : 0,
    [fragments]
  );

  const allTags = fragments.flatMap((f) => f.tags);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const allTraces = [...new Set(fragments.flatMap((f) => f.traces))];
  const lastFragment = fragments.length > 0 ? fragments[fragments.length - 1] : null;

  const darkPct =
    fragments.length > 0 ? (profile.darkChoices / fragments.length) * 100 : 50;

  const unlockedAch = ACHIEVEMENTS.filter((a) => a.check(fragments, achievementMeta));
  const recentAch = unlockedAch.slice(-3).reverse();

  const tendencyColor =
    profile.tendency === "shadow"
      ? "#dc2626"
      : profile.tendency === "light"
      ? "#c4923a"
      : "#a855f7";

  const sessionHash = useMemo(() => {
    if (fragments.length === 0) return "—";
    const data = fragments.map((f) => f.id).join(",");
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
    }
    return "0x" + Math.abs(hash).toString(16).padStart(8, "0");
  }, [fragments]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 250, damping: 25 }}
            className="manila-folder w-full sm:max-w-md sm:w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto uxpm-smooth-scroll relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Paper clip decoration */}
            <div className="absolute -top-1 right-8 w-4 h-8 border-2 border-noir-muted/20 rounded-t-full" />

            {/* CONFIDENCIAL stamp */}
            <div
              className="absolute top-12 right-4 text-[10px] font-body text-red-800/20 uppercase tracking-[0.3em] select-none pointer-events-none"
              style={{ transform: "rotate(-12deg)" }}
            >
              CONFIDENCIAL
            </div>

            <div className="p-5 sm:p-7">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-noir-muted hover:text-noir-accent uxpm-press"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* ── HEADER ── */}
              <div className="mb-5">
                <p className="text-[8px] font-body text-noir-muted/40 uppercase tracking-[0.4em] mb-1">
                  Expediente de caso
                </p>
                <h2 className="font-display text-lg text-noir-accent tracking-wider">
                  Perfil Psicológico
                </h2>
                <div className="h-[1px] bg-gradient-to-r from-noir-accent/30 to-transparent mt-2" />
              </div>

              {/* ── IDENTIFICACIÓN ── */}
              <section className="mb-5">
                <p className="text-[8px] font-body text-noir-muted/50 uppercase tracking-[0.3em] mb-2 border-b border-noir-border/20 pb-1">
                  Identificación
                </p>
                <div className="space-y-1.5 text-[10px] font-body">
                  <div className="flex justify-between">
                    <span className="text-noir-muted">Sujeto</span>
                    <span className="text-noir-text font-display">{profileName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-noir-muted">Estado</span>
                    <span className="text-noir-text">
                      {fragments.length >= 15 ? "Caso cerrado" : "Investigación activa"}
                    </span>
                  </div>
                </div>
              </section>

              {/* ── ACTIVIDAD ── */}
              <section className="mb-5">
                <p className="text-[8px] font-body text-noir-muted/50 uppercase tracking-[0.3em] mb-2 border-b border-noir-border/20 pb-1">
                  Actividad
                </p>
                {/* Segmented progress */}
                <div className="flex gap-[2px] mb-2">
                  {Array.from({ length: 15 }, (_, i) => (
                    <div
                      key={i}
                      className="h-[5px] flex-1 transition-colors duration-300"
                      style={{
                        backgroundColor:
                          i < fragments.length
                            ? i < 5
                              ? "#c4923a"
                              : i < 12
                              ? "#dc2626"
                              : "#a855f7"
                            : "#1a1a1a",
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-body text-noir-muted">
                  <span>{fragments.length}/15 fragmentos</span>
                  {lastFragment && (
                    <span>Último: {formatRelative(lastFragment.timestamp)}</span>
                  )}
                </div>
              </section>

              {/* ── PERFIL PSICOLÓGICO ── */}
              <section className="mb-5">
                <p className="text-[8px] font-body text-noir-muted/50 uppercase tracking-[0.3em] mb-2 border-b border-noir-border/20 pb-1">
                  Perfil psicológico
                </p>

                {/* Tendency badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[9px] font-body uppercase tracking-[0.2em] px-2 py-1 border"
                    style={{ borderColor: `${tendencyColor}40`, color: tendencyColor }}
                  >
                    {profile.tendency === "shadow"
                      ? "Sombra"
                      : profile.tendency === "light"
                      ? "Luz"
                      : "Equilibrio"}
                  </span>
                  <span className="text-[9px] font-body text-noir-muted/50">
                    ({profile.darkChoices} oscuras / {profile.lightChoices} luminosas)
                  </span>
                </div>

                {/* Alignment bar with needle */}
                <div className="mb-3">
                  <div className="h-[6px] bg-noir-border/20 relative overflow-hidden border border-noir-border/15">
                    <motion.div
                      className="absolute left-0 top-0 h-full"
                      style={{
                        background: "linear-gradient(to right, #991b1b, #b45309, #c4923a)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${darkPct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                    <motion.div
                      className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-noir-text shadow-[0_0_4px_rgba(232,213,176,0.5)]"
                      initial={{ left: "50%" }}
                      animate={{ left: `${darkPct}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[7px] font-body text-noir-muted/40">
                    <span>Sombra</span>
                    <span className="font-mono text-noir-muted/60">{darkPct.toFixed(0)}%</span>
                    <span>Luz</span>
                  </div>
                </div>

                {/* Tags */}
                {topTags.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[8px] font-body text-noir-muted/40 block mb-1">
                      Temas dominantes
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {topTags.map(([tag, count]) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 border border-noir-border/30 bg-noir-bg/20 text-[8px] font-body text-noir-text/60"
                        >
                          {tag} <span className="text-noir-accent/40">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* ── TONO PROMEDIO — Gauge ── */}
              <section className="mb-5">
                <p className="text-[8px] font-body text-noir-muted/50 uppercase tracking-[0.3em] mb-2 border-b border-noir-border/20 pb-1">
                  Tono promedio
                </p>
                <div className="flex items-center justify-center">
                  <ToneGauge value={avgTone} />
                </div>
                <p className="text-center text-[9px] font-mono text-noir-muted mt-1">
                  {avgTone.toFixed(1)} / 10
                </p>
              </section>

              {/* ── TRAZAS ── */}
              {allTraces.length > 0 && (
                <section className="mb-5">
                  <p className="text-[8px] font-body text-noir-muted/50 uppercase tracking-[0.3em] mb-2 border-b border-noir-border/20 pb-1">
                    Trazas acumuladas ({allTraces.length})
                  </p>
                  <p className="text-[8px] font-body text-noir-muted/40 mb-1.5">
                    Pistas sobre la identidad extraídas de los fragmentos
                  </p>
                  <div className="space-y-0.5 max-h-20 overflow-y-auto uxpm-smooth-scroll">
                    {allTraces.map((trace) => (
                      <p
                        key={trace}
                        className="text-[9px] font-body text-noir-text/50 pl-2 border-l border-noir-accent/20"
                      >
                        {trace}
                      </p>
                    ))}
                  </div>
                </section>
              )}

              {/* ── LOGROS ── */}
              <section className="mb-4">
                <p className="text-[8px] font-body text-noir-muted/50 uppercase tracking-[0.3em] mb-2 border-b border-noir-border/20 pb-1">
                  Logros ({unlockedAch.length}/{ACHIEVEMENTS.length})
                </p>
                {recentAch.length > 0 ? (
                  <div className="space-y-1">
                    {recentAch.map((ach) => (
                      <div key={ach.id} className="flex items-center gap-2 text-[9px] font-body">
                        <span className="font-mono text-noir-accent text-[11px]">{ach.asciiIcon}</span>
                        <span className="text-noir-text/60">{ach.title}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] font-body text-noir-muted/30">Ninguno aún</p>
                )}
              </section>

              {/* ── FOOTER ── */}
              <div className="border-t border-noir-border/20 pt-3">
                <p className="text-[7px] font-body text-noir-muted/25 text-center tracking-[0.2em]">
                  ARCHIVO CLASIFICADO — 0G STORAGE — SESIÓN {sessionHash}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
