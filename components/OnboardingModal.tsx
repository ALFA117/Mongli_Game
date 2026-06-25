"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import WalletButton from "./WalletButton";

const Skull3D = dynamic(() => import("./Skull3D"), { ssr: false });

const STEPS = [
  {
    title: "¿Qué es Mongli?",
    content: (
      <>
        <div className="w-[120px] h-[120px] mx-auto mb-4"><Skull3D scene="void" className="w-full h-full" /></div>
        <p className="font-display text-sm text-noir-text mb-2">Un juego de amnesia donde la IA escribe tu historia</p>
        <p className="font-body text-xs text-noir-muted">y la blockchain la guarda para siempre.</p>
      </>
    ),
  },
  {
    title: "Cómo funciona",
    content: (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
        {[
          { icon: "🎭", label: "Elige", desc: "Tus decisiones definen la historia" },
          { icon: "🧠", label: "La IA recuerda", desc: "Claude genera fragmentos únicos" },
          { icon: "⛓", label: "0G guarda", desc: "Permanente en la blockchain" },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 }} className="text-center">
            <span className="text-2xl block mb-2">{item.icon}</span>
            <p className="font-display text-xs text-noir-accent mb-1">{item.label}</p>
            <p className="font-body text-[10px] text-noir-muted">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    title: "Tu identidad",
    content: (
      <div className="py-4">
        <p className="font-body text-xs text-noir-muted text-center mb-4">¿Cuál eres tú? Solo tus decisiones lo revelarán.</p>
        <div className="flex justify-center gap-6">
          {[
            { name: "El Arquitecto", color: "#b42828", symbol: "▓" },
            { name: "El Testigo", color: "#c4923a", symbol: "░" },
            { name: "El Espejo", color: "#7c3aed", symbol: "◐" },
          ].map(id => (
            <div key={id.name} className="text-center">
              <span className="text-3xl block mb-2" style={{ color: id.color }}>{id.symbol}</span>
              <p className="font-display text-[10px]" style={{ color: id.color }}>{id.name}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Conecta y despierta",
    content: (
      <div className="py-4 text-center">
        <div className="mb-4"><WalletButton /></div>
        <p className="font-body text-[10px] text-noir-muted mb-2">Necesitas MetaMask y tokens gratuitos de 0G Galileo</p>
        <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer"
          className="font-body text-[10px] text-noir-accent hover:underline">Obtener tokens gratis →</a>
      </div>
    ),
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("mongli-onboarding-seen")) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  const close = () => {
    setVisible(false);
    if (typeof window !== "undefined") localStorage.setItem("mongli-onboarding-seen", "1");
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
        style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.85)" }}>
        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
          className="bg-noir-card border border-noir-border p-6 sm:p-8 max-w-md w-full relative">
          {/* Skip */}
          <button onClick={close} className="absolute top-3 right-3 font-body text-[9px] text-noir-muted/40 hover:text-noir-accent">
            Saltar
          </button>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= step ? "bg-noir-accent" : "bg-noir-border/40"}`} />
            ))}
          </div>

          {/* Title */}
          <p className="font-body text-[8px] text-noir-muted/40 uppercase tracking-[0.3em] text-center mb-1">
            Paso {step + 1} de {STEPS.length}
          </p>
          <h3 className="font-display text-sm text-noir-accent text-center tracking-wider mb-4">
            {STEPS[step].title}
          </h3>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {STEPS[step].content}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(p => Math.max(0, p - 1))} disabled={step === 0}
              className={`font-body text-xs ${step === 0 ? "opacity-20" : "text-noir-muted hover:text-noir-accent"}`}>
              ← Anterior
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(p => p + 1)}
                className="px-4 py-1.5 border border-noir-accent text-noir-accent font-display text-xs uxpm-press">
                Siguiente →
              </button>
            ) : (
              <button onClick={close}
                className="px-4 py-1.5 border-2 border-noir-accent bg-noir-accent/15 text-noir-accent font-display text-xs uxpm-press">
                DESPERTAR
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
