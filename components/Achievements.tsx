"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Fragment } from "@/lib/types";
import { buildPlayerProfile } from "@/lib/types";
import type { AchievementCategory } from "@/lib/audio";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  asciiIcon: string;
  category: AchievementCategory;
  check: (fragments: Fragment[], meta: AchievementMeta) => boolean;
}

export interface AchievementMeta {
  fragmentViewCounts: Record<number, number>;
  txLinkClicked: boolean;
  pointOfNoReturnTriggered: boolean;
}

interface AchievementsProps {
  fragments: Fragment[];
  meta: AchievementMeta;
  visible: boolean;
  onClose: () => void;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_memory",
    title: "Primer Recuerdo",
    description: "Desbloqueaste tu primer fragmento de memoria",
    icon: "💀",
    asciiIcon: "▪▪▪",
    category: "exploration",
    check: (f) => f.length >= 1,
  },
  {
    id: "five_deep",
    title: "Cinco Profundo",
    description: "Completaste 5 fragmentos — Acto I terminado",
    icon: "🕯️",
    asciiIcon: "▫▫▫",
    category: "exploration",
    check: (f) => f.length >= 5,
  },
  {
    id: "fog_clears",
    title: "La Niebla Se Despeja",
    description: "Leíste todos los fragmentos del Acto I",
    icon: "🌫️",
    asciiIcon: "░▒▓",
    category: "exploration",
    check: (f) => {
      const actI = [1, 2, 3, 4, 5];
      return actI.every((id) => f.some((frag) => frag.id === id && frag.unlocked));
    },
  },
  {
    id: "dark_path",
    title: "Camino Oscuro",
    description: "Elegiste la sombra 3 veces seguidas",
    icon: "🖤",
    asciiIcon: "███",
    category: "decision",
    check: (f) => {
      if (f.length < 3) return false;
      const last3 = f.slice(-3);
      return last3.every((frag) => {
        const t = frag.choiceMade.toLowerCase();
        return (
          t.includes("culpa") || t.includes("sospech") || t.includes("sombra") ||
          t.includes("cavar") || t.includes("oscur") || t.includes("confrontar") ||
          t.includes("acusar") || t.includes("quemar") || t.includes("consum")
        );
      });
    },
  },
  {
    id: "light_seeker",
    title: "Buscador de Luz",
    description: "Elegiste la luz 3 veces seguidas",
    icon: "✨",
    asciiIcon: "◇◇◇",
    category: "exploration",
    check: (f) => {
      if (f.length < 3) return false;
      const last3 = f.slice(-3);
      return last3.every((frag) => {
        const t = frag.choiceMade.toLowerCase();
        return (
          t.includes("alivio") || t.includes("confiar") || t.includes("luz") ||
          t.includes("perdon") || t.includes("paz") || t.includes("proteg") ||
          t.includes("reconstruir") || t.includes("resist")
        );
      });
    },
  },
  {
    id: "point_no_return",
    title: "Punto Sin Retorno",
    description: "Elegiste una decisión sin retorno por primera vez",
    icon: "⚠️",
    asciiIcon: "▼▼▼",
    category: "decision",
    check: (_f, meta) => meta.pointOfNoReturnTriggered,
  },
  {
    id: "high_tension",
    title: "Alta Tensión",
    description: "Un fragmento alcanzó un tono de 9 o más",
    icon: "⚡",
    asciiIcon: "╬╬╬",
    category: "general",
    check: (f) => f.some((frag) => frag.toneScore >= 9),
  },
  {
    id: "act_two",
    title: "Dos Identidades",
    description: "Entraste al Acto II — las identidades emergen",
    icon: "🎭",
    asciiIcon: "◧◨◧",
    category: "exploration",
    check: (f) => f.length >= 6,
  },
  {
    id: "echo_past",
    title: "Eco Del Pasado",
    description: "Abriste el mismo fragmento 3 veces",
    icon: "🔄",
    asciiIcon: "◈◈◈",
    category: "obsession",
    check: (_f, meta) => Object.values(meta.fragmentViewCounts).some((c) => c >= 3),
  },
  {
    id: "chain_truth",
    title: "La Cadena No Miente",
    description: "Verificaste un hash en el explorador de 0G",
    icon: "🔗",
    asciiIcon: "⬡⬡⬡",
    category: "verification",
    check: (_f, meta) => meta.txLinkClicked,
  },
  {
    id: "collector",
    title: "Coleccionista",
    description: "Recopilaste 10 fragmentos de memoria",
    icon: "📚",
    asciiIcon: "▥▥▥",
    category: "exploration",
    check: (f) => f.length >= 10,
  },
  {
    id: "two_faces",
    title: "Dos Caras",
    description: "Exactamente 50/50 luz y sombra al llegar al fragmento 10",
    icon: "🌓",
    asciiIcon: "◐◑◐",
    category: "balance",
    check: (f) => {
      if (f.length < 10) return false;
      const first10 = f.slice(0, 10);
      const profile = buildPlayerProfile(first10);
      return profile.darkChoices === profile.lightChoices && profile.darkChoices > 0;
    },
  },
  {
    id: "on_chain",
    title: "On-Chain",
    description: "Todos tus recuerdos están grabados en 0G",
    icon: "⛓️",
    asciiIcon: "⟐⟐⟐",
    category: "verification",
    check: (f) => f.length >= 1 && f.every((frag) => !!frag.txHash),
  },
  {
    id: "trace_hunter",
    title: "Cazador de Trazas",
    description: "Acumulaste 5 trazas diferentes",
    icon: "🔍",
    asciiIcon: "⌖⌖⌖",
    category: "exploration",
    check: (f) => {
      const traces = new Set(f.flatMap((frag) => frag.traces));
      return traces.size >= 5;
    },
  },
  {
    id: "revelation",
    title: "La Revelación",
    description: "Completaste los 15 fragmentos y descubriste la verdad",
    icon: "👁️",
    asciiIcon: "◉◉◉",
    category: "general",
    check: (f) => f.length >= 15,
  },
];

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  exploration: "exploración",
  decision: "decisión",
  obsession: "obsesión",
  verification: "verificación",
  balance: "equilibrio",
  general: "general",
};

const CATEGORY_COLORS: Record<AchievementCategory, string> = {
  exploration: "#c4923a",
  decision: "#dc2626",
  obsession: "#a855f7",
  verification: "#22c55e",
  balance: "#3b82f6",
  general: "#e8d5b0",
};

export default function Achievements({ fragments, meta, visible, onClose }: AchievementsProps) {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.check(fragments, meta)).length;

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
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="bg-noir-card border border-noir-border w-full sm:max-w-lg sm:w-full max-h-[85vh] overflow-y-auto uxpm-smooth-scroll p-5 sm:p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-noir-muted hover:text-noir-accent uxpm-press"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Header */}
            <div className="mb-5 pr-8">
              <h2 className="font-display text-lg text-noir-accent tracking-wider">Logros</h2>
              <p className="font-body text-[10px] text-noir-muted mt-1">
                {unlockedCount} de {ACHIEVEMENTS.length} desbloqueados
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-[3px] bg-noir-border/30 mb-5 relative overflow-hidden">
              <motion.div
                className="absolute left-0 top-0 h-full bg-noir-accent"
                initial={{ width: 0 }}
                animate={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>

            {/* Achievement list */}
            <div className="space-y-1.5">
              {ACHIEVEMENTS.map((ach, i) => {
                const unlocked = ach.check(fragments, meta);
                const catColor = CATEGORY_COLORS[ach.category];

                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 border transition-colors ${
                      unlocked
                        ? "border-noir-accent/20 bg-noir-accent/5"
                        : "border-noir-border/20 opacity-35"
                    }`}
                  >
                    {/* ASCII icon */}
                    <span
                      className="font-mono text-[14px] sm:text-[16px] w-12 text-center shrink-0 select-none"
                      style={{ color: unlocked ? catColor : "#2a2a2a" }}
                    >
                      {unlocked ? ach.asciiIcon : "???"}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`font-display text-[11px] ${unlocked ? "text-noir-text" : "text-noir-muted"}`}>
                          {ach.title}
                        </p>
                        <span
                          className="text-[7px] font-body uppercase tracking-wider px-1 py-0.5 border"
                          style={{
                            color: unlocked ? catColor : "#2a2a2a",
                            borderColor: unlocked ? `${catColor}40` : "#1a1a1a",
                          }}
                        >
                          {CATEGORY_LABELS[ach.category]}
                        </span>
                      </div>
                      <p className="font-body text-[9px] text-noir-muted truncate">
                        {unlocked ? ach.description : "???"}
                      </p>
                    </div>

                    {unlocked && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-green-500 text-xs shrink-0"
                      >
                        &#10003;
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
