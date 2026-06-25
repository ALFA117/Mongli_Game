"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import { useKeyboardNav } from "@/lib/useKeyboardNav";
import { useRouter } from "next/navigation";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

interface TerminalLine {
  type: "command" | "output" | "blank";
  text: string;
  color?: string;
}

const BOOT_SEQUENCE: TerminalLine[] = [
  { type: "command", text: "whoami" },
  { type: "output", text: "MONGLI GAME — Sistema de Recuperación de Memoria v1.0" },
  { type: "output", text: "Hackathon: Zero Cup 2026 · 0G Labs" },
  { type: "blank", text: "" },
  { type: "command", text: "cat README.md" },
  { type: "output", text: "Juego narrativo de amnesia psicológica con estética noir." },
  { type: "output", text: "La IA escribe tu historia. La blockchain la guarda para siempre." },
  { type: "output", text: "Cada decisión desbloquea un fragmento de memoria generado por" },
  { type: "output", text: "Claude, almacenado en 0G Storage y registrado en 0G Chain." },
  { type: "output", text: 'Pitch: "Tus recuerdos son tuyos. Nadie puede borrarlos."' },
  { type: "blank", text: "" },
  { type: "command", text: "./how-it-works.sh" },
  { type: "output", text: "[1] Conectas tu wallet — tu identidad en la cadena" },
  { type: "output", text: "[2] Exploras una escena — el sistema detecta tu presencia" },
  { type: "output", text: "[3] La IA genera tu fragmento — único, irrepetible" },
  { type: "output", text: "[4] 0G Storage lo graba — permanente, inmutable" },
  { type: "output", text: "[5] 0G Chain lo registra — verificable, tuyo para siempre" },
  { type: "output", text: "[6] Tú decides — y el sistema recuerda tu elección" },
  { type: "blank", text: "" },
  { type: "command", text: "cat stack.json" },
  { type: "output", text: "{", color: "#c4923a" },
  { type: "output", text: '  "frontend":  "Next.js 14 + TypeScript + Tailwind",', color: "#c4923a" },
  { type: "output", text: '  "3d":        "Three.js + React Three Fiber",', color: "#c4923a" },
  { type: "output", text: '  "animation": "Framer Motion",', color: "#c4923a" },
  { type: "output", text: '  "ai":        "Claude claude-sonnet-4-6 (Anthropic API)",', color: "#c4923a" },
  { type: "output", text: '  "storage":   "0G Storage (descentralizado)",', color: "#c4923a" },
  { type: "output", text: '  "chain":     "0G Chain (Galileo Testnet, EVM)",', color: "#c4923a" },
  { type: "output", text: '  "wallet":    "RainbowKit + wagmi + viem",', color: "#c4923a" },
  { type: "output", text: '  "audio":     "Howler.js (procedural)",', color: "#c4923a" },
  { type: "output", text: '  "contract":  "MongliMemory.sol (Solidity)"', color: "#c4923a" },
  { type: "output", text: "}", color: "#c4923a" },
  { type: "blank", text: "" },
  { type: "command", text: "./why-0g.sh" },
  { type: "output", text: "┌─────────────────────────────────────────┐", color: "#dc2626" },
  { type: "output", text: "│  SIN 0G:                                │", color: "#dc2626" },
  { type: "output", text: "│  - Tus recuerdos pueden ser borrados    │", color: "#dc2626" },
  { type: "output", text: "│  - La IA puede negar que exististe      │", color: "#dc2626" },
  { type: "output", text: "│  - La historia se pierde al cerrar      │", color: "#dc2626" },
  { type: "output", text: "└─────────────────────────────────────────┘", color: "#dc2626" },
  { type: "output", text: "┌─────────────────────────────────────────┐", color: "#22c55e" },
  { type: "output", text: "│  CON 0G:                                │", color: "#22c55e" },
  { type: "output", text: "│  - Recuerdos permanentes e inviolables  │", color: "#22c55e" },
  { type: "output", text: "│  - Cada fragmento verificable on-chain  │", color: "#22c55e" },
  { type: "output", text: "│  - Tu historia es tuya para siempre     │", color: "#22c55e" },
  { type: "output", text: "└─────────────────────────────────────────┘", color: "#22c55e" },
  { type: "output", text: "" },
  { type: "output", text: "0G no es bolt-on: sin 0G la premisa narrativa se rompe." },
  { type: "output", text: "Los recuerdos del jugador DEBEN ser permanentes e inviolables." },
  { type: "output", text: "Eso solo es posible con almacenamiento descentralizado real." },
  { type: "blank", text: "" },
  { type: "command", text: "cat credits.txt" },
  { type: "output", text: "Desarrollado por: Edgar Lopez Baeza (@ALFA_EDG)" },
  { type: "output", text: "Hackathon: Zero Cup 2026 — 0G Labs" },
  { type: "output", text: "Ubicación: México" },
  { type: "output", text: "Fecha: Junio 2026" },
  { type: "output", text: "" },
  { type: "output", text: 'Escribe "help" para ver comandos disponibles.' },
];

const HELP_OUTPUT: TerminalLine[] = [
  { type: "output", text: "Comandos disponibles:", color: "#c4923a" },
  { type: "output", text: "  help       — muestra este mensaje" },
  { type: "output", text: "  play       — ir al juego" },
  { type: "output", text: "  clear      — limpiar terminal" },
  { type: "output", text: "  fragments  — fragmentos generados esta sesión" },
  { type: "output", text: "  whoami     — información del sistema" },
  { type: "output", text: "  ESC        — volver al juego" },
];

export default function AboutPage() {
  const router = useRouter();
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [bootComplete, setBootComplete] = useState(false);
  const [currentTyping, setCurrentTyping] = useState("");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bootIdx = useRef(0);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentTyping]);

  // Boot sequence — typewriter commands, instant output
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const addNextLine = () => {
      if (bootIdx.current >= BOOT_SEQUENCE.length) {
        setBootComplete(true);
        setCurrentTyping("");
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }

      const line = BOOT_SEQUENCE[bootIdx.current];
      bootIdx.current++;

      if (line.type === "command") {
        // Typewrite the command
        const cmd = line.text;
        let charIdx = 0;
        setCurrentTyping("$ ");

        const typeChar = () => {
          if (charIdx < cmd.length) {
            setCurrentTyping("$ " + cmd.slice(0, charIdx + 1));
            charIdx++;
            timeout = setTimeout(typeChar, 30 + Math.random() * 30);
          } else {
            setCurrentTyping("");
            setLines((prev) => [...prev, line]);
            timeout = setTimeout(addNextLine, 200);
          }
        };
        timeout = setTimeout(typeChar, 300);
      } else {
        // Output lines appear instantly
        setLines((prev) => [...prev, line]);
        timeout = setTimeout(addNextLine, 40);
      }
    };

    timeout = setTimeout(addNextLine, 800);
    return () => clearTimeout(timeout);
  }, []);

  const executeCommand = useCallback(
    (cmd: string) => {
      const trimmed = cmd.trim().toLowerCase();
      setLines((prev) => [...prev, { type: "command", text: trimmed }]);

      switch (trimmed) {
        case "help":
          setLines((prev) => [...prev, ...HELP_OUTPUT]);
          break;
        case "play":
          router.push("/");
          break;
        case "clear":
          setLines([]);
          break;
        case "fragments": {
          let count = 0;
          try {
            const stored = localStorage.getItem("mongli-fragment-count");
            if (stored) count = parseInt(stored, 10);
          } catch { /* noop */ }
          setLines((prev) => [
            ...prev,
            { type: "output", text: `Fragmentos generados esta sesión: ${count}` },
            {
              type: "output",
              text: count === 0
                ? 'Aún no has jugado. Escribe "play" para comenzar.'
                : "Cada fragmento está grabado permanentemente en 0G Storage.",
            },
          ]);
          break;
        }
        case "whoami":
          setLines((prev) => [
            ...prev,
            { type: "output", text: "MONGLI GAME — Sistema de Recuperación de Memoria v1.0" },
            { type: "output", text: "Stack: Next.js 14 + Claude + 0G Storage + 0G Chain" },
          ]);
          break;
        default:
          setLines((prev) => [
            ...prev,
            { type: "output", text: `comando no reconocido: "${trimmed}"`, color: "#dc2626" },
            { type: "output", text: 'Escribe "help" para ver comandos disponibles.' },
          ]);
      }
      setInput("");
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && input.trim()) {
        executeCommand(input);
      }
    },
    [input, executeCommand]
  );

  useKeyboardNav({
    onEscape: () => router.push("/"),
    enabled: true,
  });

  return (
    <div className="min-h-screen bg-black relative flex" onClick={() => inputRef.current?.focus()}>
      <Cursor />
      <ScanlineOverlay />

      {/* Terminal area */}
      <div className="flex-1 flex flex-col min-h-screen max-w-4xl mx-auto w-full">
        {/* Terminal header bar */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-green-900/30">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            <span className="ml-3 font-mono text-[10px] text-green-600/60">
              mongli@0g-chain:~
            </span>
          </div>
          <button
            onClick={() => router.push("/")}
            className="font-mono text-[10px] text-green-700/50 hover:text-green-500 transition-colors uxpm-press px-2 py-1"
          >
            [ESC] salir
          </button>
        </div>

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 font-mono text-[11px] sm:text-[12px] leading-[1.7] uxpm-smooth-scroll"
          style={{ color: "#00ff41" }}
        >
          {/* Rendered lines */}
          {lines.map((line, i) => {
            if (line.type === "blank") {
              return <div key={i} className="h-3" />;
            }
            if (line.type === "command") {
              return (
                <div key={i}>
                  <span className="text-green-500/50">$ </span>
                  <span className="text-green-400">{line.text}</span>
                </div>
              );
            }
            return (
              <div key={i} style={{ color: line.color || "#00ff41cc" }}>
                {line.text || " "}
              </div>
            );
          })}

          {/* Currently typing (boot sequence) */}
          {currentTyping && (
            <div>
              <span style={{ color: "#00ff41" }}>{currentTyping}</span>
              <span className="inline-block w-2 h-3 bg-green-500 ml-0.5 animate-pulse" />
            </div>
          )}

          {/* Interactive prompt */}
          {bootComplete && (
            <div className="flex items-center mt-1">
              <span className="text-green-500/50 shrink-0">$ </span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent outline-none text-green-400 font-mono text-[11px] sm:text-[12px] ml-0.5 caret-green-500"
                style={{ caretColor: "#00ff41" }}
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
              {input === "" && (
                <span className="inline-block w-2 h-3 bg-green-500 animate-pulse" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Skull3D decoration — right side, desktop only */}
      <div className="hidden lg:block w-[25%] relative opacity-30">
        <div className="sticky top-0 h-screen">
          <Skull3D className="w-full h-full" scene="archive" />
        </div>
      </div>
    </div>
  );
}
