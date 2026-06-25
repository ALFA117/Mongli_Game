"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { initAudio } from "@/lib/audio";

interface LoadingScreenProps {
  onComplete: () => void;
}

const LOADING_PHRASES = [
  "Fragmentando recuerdos...",
  "Conectando sinapsis perdidas...",
  "Descifrando huellas neuronales...",
  "Reconstruyendo identidad...",
  "Accediendo a 0G Storage...",
  "Verificando cadena de bloques...",
  "Cargando narrador IA...",
];

const BOOT_LINES = [
  "> MONGLI SYSTEM v0.1.0",
  "> Initializing noir_engine...",
  "> Loading 0G Storage driver... OK",
  "> Connecting to Galileo Testnet... OK",
  "> Claude claude-sonnet-4-6 narrator... READY",
  "> Memory fragmentation module... ACTIVE",
  "> Starting session...",
];

const SEGMENTS = 20;

function useTypewriterPhrase(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

function FallingBinaryParticle({ delay, left }: { delay: number; left: number }) {
  const char = Math.random() > 0.5 ? "1" : "0";
  return (
    <motion.span
      className="absolute font-mono text-[10px] text-noir-accent/20 select-none"
      style={{ left: `${left}%` }}
      initial={{ top: "-5%", opacity: 0 }}
      animate={{ top: "105%", opacity: [0, 0.4, 0.3, 0] }}
      transition={{
        duration: 4 + Math.random() * 6,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      {char}
    </motion.span>
  );
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [phase, setPhase] = useState<"boot" | "loading" | "done">("boot");
  const [bootLine, setBootLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [staticOpacity, setStaticOpacity] = useState(0.08);
  const hasStartedAudio = useRef(false);

  const phrase = LOADING_PHRASES[phraseIndex];
  const { displayed: typewriterPhrase, done: phraseDone } = useTypewriterPhrase(
    phase === "loading" ? phrase : "",
    35
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        delay: Math.random() * 5,
        left: Math.random() * 100,
      })),
    []
  );

  // Boot sequence
  useEffect(() => {
    if (phase !== "boot") return;
    const interval = setInterval(() => {
      setBootLine((prev) => {
        if (prev >= BOOT_LINES.length - 1) {
          clearInterval(interval);
          setTimeout(() => setPhase("loading"), 400);
          return prev;
        }
        return prev + 1;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [phase]);

  // Loading progress
  useEffect(() => {
    if (phase !== "loading") return;

    if (!hasStartedAudio.current) {
      initAudio();
      hasStartedAudio.current = true;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        const increment = Math.random() * 8 + 2;
        const next = Math.min(prev + increment, 100);

        const newPhraseIdx = Math.min(
          Math.floor((next / 100) * LOADING_PHRASES.length),
          LOADING_PHRASES.length - 1
        );
        if (newPhraseIdx !== phraseIndex) {
          setPhraseIndex(newPhraseIdx);
        }

        // Decrease static as progress increases
        setStaticOpacity(0.08 * (1 - next / 100));

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setPhase("done");
            setVisible(false);
            setTimeout(onComplete, 600);
          }, 800);
        }
        return next;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [phase, onComplete, phraseIndex]);

  const filledSegments = Math.floor((progress / 100) * SEGMENTS);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[10001] bg-noir-bg flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Falling binary particles */}
          <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
              <FallingBinaryParticle key={p.id} delay={p.delay} left={p.left} />
            ))}
          </div>

          {/* Static noise overlay — fades out with progress */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              opacity: staticOpacity,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              animation: "grainShift 0.15s steps(1) infinite",
            }}
          />

          {/* Boot sequence phase */}
          <AnimatePresence mode="wait">
            {phase === "boot" && (
              <motion.div
                key="boot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="w-80 text-left"
              >
                {BOOT_LINES.slice(0, bootLine + 1).map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i === bootLine ? 1 : 0.4 }}
                    className={`font-mono text-[11px] leading-relaxed ${
                      i === bootLine ? "text-green-500" : "text-green-800"
                    }`}
                  >
                    {line}
                  </motion.p>
                ))}
                <motion.span
                  className="inline-block w-2 h-3 bg-green-500 ml-1"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
              </motion.div>
            )}

            {/* Loading phase */}
            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-8 relative z-10"
              >
                {/* Glitch title */}
                <motion.h1
                  className="font-display text-4xl md:text-6xl text-noir-text text-shadow-noir tracking-[0.3em] relative"
                  animate={{ opacity: [1, 0.7, 1, 0.9, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  MONGLI
                  <motion.span
                    className="absolute inset-0 text-noir-accent opacity-30"
                    style={{ clipPath: "inset(40% 0 30% 0)" }}
                    animate={{ x: [-2, 2, -1, 0], opacity: [0, 0.5, 0, 0.3] }}
                    transition={{ duration: 0.3, repeat: Infinity, repeatDelay: 2 }}
                  >
                    MONGLI
                  </motion.span>
                </motion.h1>

                {/* Segmented progress bar */}
                <div className="flex gap-[2px] w-72">
                  {Array.from({ length: SEGMENTS }, (_, i) => (
                    <motion.div
                      key={i}
                      className="h-[3px] flex-1"
                      initial={{ opacity: 0.15 }}
                      animate={{
                        opacity: i < filledSegments ? 1 : 0.15,
                        backgroundColor:
                          i < filledSegments ? "#c4923a" : "#2a2a2a",
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>

                {/* Percentage */}
                <p className="font-mono text-[10px] text-noir-muted/60 -mt-5">
                  {Math.floor(progress)}%
                </p>

                {/* Typewriter phrase */}
                <div className="h-6">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={phraseIndex}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.3 }}
                      className="font-body text-[10px] text-noir-muted tracking-[0.3em] uppercase"
                    >
                      {typewriterPhrase}
                      {!phraseDone && (
                        <motion.span
                          className="inline-block w-1 h-3 bg-noir-accent/60 ml-0.5 align-middle"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scanlines */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(232,213,176,0.1) 2px, rgba(232,213,176,0.1) 4px)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
