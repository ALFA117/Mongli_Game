"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import GlitchText from "@/components/GlitchText";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

const IDENTITIES = {
  arquitecto: {
    name: "El Arquitecto",
    color: "#b42828",
    description: "Diseñó cada trampa, cada mentira, cada sombra. La amnesia fue su último acto de cobardía.",
  },
  testigo: {
    name: "El Testigo",
    color: "#c4923a",
    description: "Siempre estuvo ahí, observando. No causó el dolor, pero tampoco lo detuvo.",
  },
  espejo: {
    name: "El Espejo",
    color: "#7c3aed",
    description: "Ni villano ni héroe. Cada decisión contenía su opuesto. La dualidad es su identidad.",
  },
};

function RevelationContent() {
  const params = useSearchParams();
  const router = useRouter();
  const identityKey = (params.get("identity") || "testigo") as keyof typeof IDENTITIES;
  const score = params.get("score") || "5.0";
  const acts = params.get("acts") || "5";
  const identity = IDENTITIES[identityKey] || IDENTITIES.testigo;

  return (
    <div className="min-h-screen flex flex-col relative">
      <Cursor />
      <ScanlineOverlay />

      <header className="flex items-center justify-between p-4 relative z-50">
        <button onClick={() => router.push("/")}
          className="font-display text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent transition-colors">
          <GlitchText text="MONGLI" intensity="low" />
        </button>
        <span className="font-body text-[9px] text-noir-muted tracking-wider">revelación compartida</span>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Skull background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-[400px] h-[400px]">
            <Skull3D scene="void" className="w-full h-full" />
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center max-w-md">
          <p className="font-body text-[9px] text-noir-muted tracking-[0.5em] uppercase mb-4">
            Un jugador ha descubierto su verdad
          </p>

          <h1 className="font-display text-3xl sm:text-5xl mb-4" style={{ color: identity.color }}>
            <GlitchText text={identity.name} intensity="low" />
          </h1>

          <p className="font-display text-sm text-noir-text/70 leading-relaxed mb-8">
            {identity.description}
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="text-center">
              <p className="font-display text-xl text-noir-text">{acts}</p>
              <p className="text-[8px] font-body text-noir-muted uppercase">actos</p>
            </div>
            <div className="text-center">
              <p className="font-display text-xl text-noir-text">{score}</p>
              <p className="text-[8px] font-body text-noir-muted uppercase">tono</p>
            </div>
          </div>

          <div className="h-[1px] bg-gradient-to-r from-transparent via-noir-accent/30 to-transparent mb-8" />

          <motion.button onClick={() => router.push("/")}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="px-8 py-3 border-2 border-noir-accent text-noir-accent font-display text-sm tracking-[0.2em] hover:bg-noir-accent/10 uxpm-press">
            Descubre quién eres tú
          </motion.button>

          <p className="font-body text-[8px] text-noir-muted/30 mt-6 tracking-wider">
            mongli-game.vercel.app · Zero Cup 2026 · 0G Labs
          </p>
        </motion.div>
      </main>
    </div>
  );
}

export default function RevelationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-noir-bg" />}>
      <RevelationContent />
    </Suspense>
  );
}
