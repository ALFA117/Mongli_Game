"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Fragment } from "@/lib/types";
import { buildPlayerProfile } from "@/lib/types";
import { ACHIEVEMENTS } from "@/components/Achievements";
import type { AchievementMeta } from "@/components/Achievements";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

interface RevelationProps {
  fragments: Fragment[];
  achievementMeta: AchievementMeta;
  visible: boolean;
  onClose: () => void;
}

// Seeded node positions matching MemoryMap
function getNodePositions(): { x: number; y: number }[] {
  return [
    { x: 50, y: 8 }, { x: 22, y: 22 }, { x: 72, y: 20 },
    { x: 38, y: 36 }, { x: 65, y: 34 }, { x: 12, y: 48 },
    { x: 45, y: 50 }, { x: 82, y: 46 }, { x: 28, y: 62 },
    { x: 58, y: 64 }, { x: 88, y: 60 }, { x: 15, y: 74 },
    { x: 35, y: 86 }, { x: 58, y: 90 }, { x: 78, y: 84 },
  ];
}

const GLITCH_CHARS = "!@#$%^&*░▒▓█▐▌◈◐◑⬡▼▲";

function useBurningTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  const [charStates, setCharStates] = useState<("hot" | "warm" | "cool")[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); setCharStates([]); return; }
    setDisplayed(""); setDone(false); setCharStates([]);
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (i >= text.length) { setDone(true); return; }
      const idx = i;
      setDisplayed(text.slice(0, idx + 1));
      setCharStates((prev) => {
        const next: ("hot" | "warm" | "cool")[] = prev.map((s) =>
          s === "hot" ? "warm" as const : s === "warm" ? "cool" as const : s
        );
        next[idx] = "hot";
        return next;
      });
      // Cool down previous chars after delay
      setTimeout(() => {
        setCharStates((prev) => {
          const next = [...prev];
          if (next[idx] === "hot") next[idx] = "warm";
          return next;
        });
      }, 300);
      setTimeout(() => {
        setCharStates((prev) => {
          const next = [...prev];
          if (next[idx] === "warm") next[idx] = "cool";
          return next;
        });
      }, 800);
      i++;
      const delay = text[idx] === "." || text[idx] === "—" ? 200 : 75;
      timeout = setTimeout(tick, delay);
    };
    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, [text, active]);

  return { displayed, charStates, done };
}

function useGlitchReveal(text: string, active: boolean) {
  const [display, setDisplay] = useState("");
  const [stable, setStable] = useState(false);

  useEffect(() => {
    if (!active) { setDisplay(""); setStable(false); return; }
    let iteration = 0;
    const maxIterations = 8;
    const interval = setInterval(() => {
      if (iteration >= maxIterations) {
        setDisplay(text);
        setStable(true);
        clearInterval(interval);
        return;
      }
      const chars = text.split("").map((ch) => {
        if (ch === " ") return " ";
        return Math.random() < iteration / maxIterations
          ? ch
          : GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      });
      setDisplay(chars.join(""));
      iteration++;
    }, 100);
    return () => clearInterval(interval);
  }, [text, active]);

  return { display, stable };
}

const IDENTITY_DATA = {
  architect: {
    name: "El Arquitecto",
    color: "#b42828",
    description:
      "Cada plano fue tuyo. Cada trampa, cada pasillo sin salida, cada puerta que solo abría hacia la oscuridad — todo fue diseñado con precisión quirúrgica. No eres la víctima que encontró estas paredes: eres quien las levantó. La amnesia fue tu última obra maestra. Borrarte fue la única forma de no tener que mirar lo que construiste. Pero las paredes siguen en pie. Y ahora sabes que cada grieta lleva tu firma.",
    summary:
      "Tus decisiones oscuras tallaron esta verdad. Cada sombra que elegiste te acercó más a quien realmente eres. Los recuerdos son permanentes. La verdad también.",
  },
  witness: {
    name: "El Testigo",
    color: "#c4923a",
    description:
      "Estuviste ahí. En cada esquina, detrás de cada puerta, en el reflejo de cada ventana rota. No moviste un dedo. No levantaste la voz. Viste cómo se construía el horror y elegiste el silencio. Tu amnesia no fue un acto de cobardía sino de piedad — hacia ti mismo. Porque recordar que pudiste hacer algo y elegiste no hacerlo es una herida que no cierra. Ahora la herida tiene nombre. El tuyo.",
    summary:
      "Elegiste la luz más veces que la sombra. Pero la luz no limpia — solo revela. Tu historia queda grabada para siempre en 0G. Nadie puede borrarla. Ni siquiera tú.",
  },
  mirror: {
    name: "El Espejo",
    color: "#7c3aed",
    description:
      "No hay respuesta. No hay villano ni héroe en esta historia porque tú eres ambos. Cada decisión que tomaste contenía su opuesto. Cada sombra que abrazaste tenía un hilo de luz. Cada momento de bondad ocultaba algo más oscuro. Tu amnesia no fue cobardía ni piedad — fue el único modo de sobrevivir la imposibilidad de ser todo a la vez. Eres el espejo en el que cualquiera puede verse. Y nadie quiere mirar.",
    summary:
      "Caminaste la línea exacta entre dos abismos. Nadie lo hace por accidente. Tu equilibrio es tu identidad — y también tu condena. El espejo no juzga. Solo refleja.",
  },
};

async function generateCaseFileImage(
  identity: keyof typeof IDENTITY_DATA,
  fragments: Fragment[],
  profile: ReturnType<typeof buildPlayerProfile>,
  avgTone: number,
  achCount: number
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = 700;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const data = IDENTITY_DATA[identity];

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, 700, 500);

  // Manila border
  ctx.fillStyle = "#151310";
  ctx.fillRect(30, 30, 640, 440);
  ctx.strokeStyle = "rgba(196,146,58,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, 640, 440);

  // Header
  ctx.fillStyle = "rgba(196,146,58,0.3)";
  ctx.font = '9px "Courier New"';
  ctx.fillText("EXPEDIENTE CLASIFICADO — MONGLI GAME — 0G CHAIN", 50, 55);

  // Identity
  ctx.fillStyle = data.color;
  ctx.font = 'bold 28px Georgia';
  ctx.fillText(data.name, 50, 100);

  // CASO CERRADO stamp
  ctx.save();
  ctx.translate(550, 90);
  ctx.rotate(-0.2);
  ctx.fillStyle = "rgba(180,40,40,0.3)";
  ctx.font = 'bold 16px "Courier New"';
  ctx.fillText("CASO CERRADO", -60, 0);
  ctx.restore();

  // Stats
  ctx.fillStyle = "#e8d5b0";
  ctx.font = '11px "Courier New"';
  const stats = [
    `FRAGMENTOS ANALIZADOS ........ ${fragments.length}/15`,
    `DECISIONES EN SOMBRA ......... ${profile.darkChoices}`,
    `DECISIONES EN LUZ ............ ${profile.lightChoices}`,
    `TONO PROMEDIO ................ ${avgTone.toFixed(1)}/10`,
    `TRAZAS ENCONTRADAS ........... ${new Set(fragments.flatMap((f) => f.traces)).size}`,
    `LOGROS DESBLOQUEADOS ......... ${achCount}/15`,
    `IDENTIDAD FINAL .............. ${data.name}`,
  ];
  stats.forEach((line, i) => {
    ctx.fillStyle = i === stats.length - 1 ? data.color : "#e8d5b0";
    ctx.fillText(line, 50, 140 + i * 22);
  });

  // Description excerpt
  ctx.fillStyle = "rgba(232,213,176,0.5)";
  ctx.font = '10px Georgia';
  const desc = data.summary.slice(0, 120) + "...";
  ctx.fillText(desc, 50, 320);

  // Footer
  ctx.fillStyle = "rgba(196,146,58,0.2)";
  ctx.font = '8px "Courier New"';
  ctx.fillText("ARCHIVO PERMANENTE — 0G STORAGE — ZERO CUP 2026", 50, 450);

  // Vignette
  const grad = ctx.createRadialGradient(350, 250, 100, 350, 250, 400);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 700, 500);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function Revelation({
  fragments,
  achievementMeta,
  visible,
  onClose,
}: RevelationProps) {
  const [phase, setPhase] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const profile = buildPlayerProfile(fragments);
  const avgTone =
    fragments.length > 0
      ? fragments.reduce((s, f) => s + f.toneScore, 0) / fragments.length
      : 0;

  const identity: keyof typeof IDENTITY_DATA =
    profile.tendency === "shadow"
      ? "architect"
      : profile.tendency === "light"
      ? "witness"
      : "mirror";

  const data = IDENTITY_DATA[identity];
  const nodePositions = getNodePositions();
  const allTraces = [...new Set(fragments.flatMap((f) => f.traces))];
  const achCount = ACHIEVEMENTS.filter((a) => a.check(fragments, achievementMeta)).length;

  const { displayed: burnText, charStates, done: burnDone } = useBurningTypewriter(
    data.description,
    phase === 2
  );
  const { display: glitchName, stable: nameStable } = useGlitchReveal(
    data.name,
    phase === 3
  );

  // Phase timing
  useEffect(() => {
    if (!visible) { setPhase(0); return; }
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => { setFlashVisible(true); setTimeout(() => setFlashVisible(false), 200); }, 3200),
      setTimeout(() => setPhase(2), 3500),
      setTimeout(() => setPhase(3), 8000),
      setTimeout(() => setPhase(4), 10500),
      setTimeout(() => setPhase(5), 13000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [visible]);

  const handleShare = useCallback(async () => {
    if (isSharing) return;
    setIsSharing(true);
    try {
      const blob = await generateCaseFileImage(identity, fragments, profile, avgTone, achCount);
      if (!blob) return;
      if (typeof navigator.share === "function") {
        const file = new File([blob], `mongli-${identity}.png`, { type: "image/png" });
        try { await navigator.share({ title: `Mongli — ${data.name}`, files: [file] }); } catch { /* cancelled */ }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `mongli-${identity}.png`; a.click();
        URL.revokeObjectURL(url);
      }
    } finally { setIsSharing(false); }
  }, [identity, fragments, profile, avgTone, achCount, data.name, isSharing]);

  const STAT_LINES = [
    { label: "FRAGMENTOS ANALIZADOS", value: `${fragments.length}/15` },
    { label: "DECISIONES EN SOMBRA", value: String(profile.darkChoices) },
    { label: "DECISIONES EN LUZ", value: String(profile.lightChoices) },
    { label: "TONO PROMEDIO", value: `${avgTone.toFixed(1)}/10` },
    { label: "TRAZAS ENCONTRADAS", value: String(allTraces.length) },
    { label: "LOGROS DESBLOQUEADOS", value: `${achCount}/15` },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10001] bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Skull3D background (phase 5) */}
          {phase >= 5 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              className="absolute inset-0"
            >
              <Skull3D className="w-full h-full" scene="void" />
            </motion.div>
          )}

          {/* Flash */}
          <AnimatePresence>
            {flashVisible && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 bg-white z-20"
              />
            )}
          </AnimatePresence>

          <div className="max-w-lg w-full text-center relative z-10 px-4 sm:px-6">
            <AnimatePresence mode="wait">
              {/* ═══ PHASE 1: Nodes converge ═══ */}
              {phase === 1 && (
                <motion.div
                  key="p1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ exit: { duration: 0.3 } }}
                  className="relative h-[250px] sm:h-[300px] flex items-center justify-center"
                >
                  {nodePositions.map((pos, i) => {
                    const frag = fragments.find((f) => f.id === i + 1);
                    return (
                      <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: frag ? data.color : "#2a2a2a",
                          boxShadow: frag ? `0 0 6px ${data.color}60` : "none",
                        }}
                        initial={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                          opacity: 0,
                          scale: 0.5,
                        }}
                        animate={{
                          left: "50%",
                          top: "50%",
                          opacity: [0, 1, 1],
                          scale: [0.5, 0.8, 0],
                        }}
                        transition={{
                          duration: 2.2,
                          delay: i * 0.08,
                          ease: [0.4, 0, 0.9, 1],
                        }}
                      />
                    );
                  })}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="font-display text-noir-muted text-xs sm:text-sm tracking-wider"
                  >
                    Procesando {fragments.length} fragmentos...
                  </motion.p>
                </motion.div>
              )}

              {/* ═══ PHASE 2: Burning text ═══ */}
              {phase === 2 && (
                <motion.div
                  key="p2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto"
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="font-body text-[9px] text-noir-muted tracking-[0.5em] uppercase mb-6"
                  >
                    La verdad se escribe
                  </motion.p>
                  <p className="font-display text-xs sm:text-sm leading-[2] tracking-wide text-left">
                    {burnText.split("").map((char, i) => {
                      const state = charStates[i] || "cool";
                      const color =
                        state === "hot"
                          ? "#ff6030"
                          : state === "warm"
                          ? "#c4923a"
                          : "#e8d5b0";
                      return (
                        <span key={i} style={{ color, transition: "color 0.4s" }}>
                          {char}
                        </span>
                      );
                    })}
                    {!burnDone && (
                      <span
                        className="inline-block w-[2px] h-[1em] align-middle ml-[1px] animate-pulse"
                        style={{ backgroundColor: "#ff6030" }}
                      />
                    )}
                  </p>
                </motion.div>
              )}

              {/* ═══ PHASE 3: Glitch name reveal ═══ */}
              {phase === 3 && (
                <motion.div
                  key="p3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    className="font-body text-[9px] text-noir-muted tracking-[0.5em] uppercase mb-4"
                  >
                    Tu identidad
                  </motion.p>
                  <h2
                    className="font-display text-4xl sm:text-5xl md:text-6xl relative inline-block"
                    style={{
                      color: nameStable ? data.color : "#e8d5b0",
                      textShadow: nameStable ? `0 0 30px ${data.color}60` : "none",
                      transition: "color 0.3s, text-shadow 0.3s",
                    }}
                  >
                    {glitchName}
                    {/* Chromatic aberration during glitch */}
                    {!nameStable && (
                      <>
                        <motion.span
                          className="absolute inset-0"
                          style={{ color: "rgba(255,60,60,0.5)", clipPath: "inset(25% 0 45% 0)" }}
                          animate={{ x: [-5, 5, -3, 0] }}
                          transition={{ duration: 0.08, repeat: Infinity }}
                        >
                          {glitchName}
                        </motion.span>
                        <motion.span
                          className="absolute inset-0"
                          style={{ color: "rgba(60,220,255,0.4)", clipPath: "inset(55% 0 15% 0)" }}
                          animate={{ x: [4, -4, 2, 0] }}
                          transition={{ duration: 0.08, repeat: Infinity }}
                        >
                          {glitchName}
                        </motion.span>
                      </>
                    )}
                  </h2>
                </motion.div>
              )}

              {/* ═══ PHASE 4: Case file stats ═══ */}
              {phase === 4 && (
                <motion.div
                  key="p4"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                >
                  <h2
                    className="font-display text-xl sm:text-2xl mb-5"
                    style={{ color: data.color }}
                  >
                    {data.name}
                  </h2>

                  <div className="manila-folder p-4 sm:p-5 max-w-sm mx-auto text-left relative">
                    <p className="text-[7px] font-body text-noir-muted/30 uppercase tracking-[0.3em] mb-3">
                      Expediente final
                    </p>
                    <div className="space-y-1.5">
                      {STAT_LINES.map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.2 }}
                          className="flex items-center justify-between text-[10px] font-body"
                        >
                          <span className="text-noir-muted">{stat.label}</span>
                          <span className="text-noir-text font-mono">{stat.value}</span>
                        </motion.div>
                      ))}
                      {/* Identity line */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: STAT_LINES.length * 0.2 }}
                        className="flex items-center justify-between text-[10px] font-body pt-1 border-t border-noir-border/20"
                      >
                        <span className="text-noir-muted">IDENTIDAD FINAL</span>
                        <span className="font-display" style={{ color: data.color }}>
                          {data.name}
                        </span>
                      </motion.div>
                    </div>

                    {/* CASO CERRADO stamp */}
                    <motion.div
                      initial={{ opacity: 0, scale: 1.5, rotate: -15 }}
                      animate={{ opacity: 0.25, scale: 1, rotate: -12 }}
                      transition={{ delay: STAT_LINES.length * 0.2 + 0.5, type: "spring" }}
                      className="absolute top-3 right-3 text-[11px] font-body text-red-700 uppercase tracking-[0.3em] font-bold border-2 border-red-800/40 px-2 py-0.5"
                      style={{ transform: "rotate(-12deg)" }}
                    >
                      Caso cerrado
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* ═══ PHASE 5: Final — buttons + Skull3D ═══ */}
              {phase === 5 && (
                <motion.div
                  key="p5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                >
                  <h2
                    className="font-display text-xl sm:text-2xl mb-2"
                    style={{ color: data.color, textShadow: `0 0 20px ${data.color}40` }}
                  >
                    {data.name}
                  </h2>
                  <p className="font-display text-xs text-noir-text/60 leading-relaxed mb-8 max-w-sm mx-auto">
                    {data.summary}
                  </p>

                  <p className="font-body text-[9px] text-noir-muted/40 mb-6">
                    Todos tus recuerdos fueron grabados permanentemente en 0G Storage + 0G Chain.
                  </p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                  >
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="px-5 py-2.5 border text-[11px] font-display tracking-wider hover:opacity-80 transition-opacity uxpm-press disabled:opacity-40 flex items-center gap-2"
                      style={{ borderColor: `${data.color}60`, color: data.color }}
                    >
                      {isSharing ? "Generando..." : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                          Compartir mi historia
                        </>
                      )}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-5 py-2.5 border border-noir-border text-noir-muted text-[11px] font-display tracking-wider hover:text-noir-accent hover:border-noir-accent/50 transition-colors uxpm-press"
                    >
                      Nueva partida
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Vignette */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_15%,black_100%)] z-[1]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
