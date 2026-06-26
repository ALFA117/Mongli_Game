"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import GlitchText from "@/components/GlitchText";
import LoadingScreen from "@/components/LoadingScreen";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import AudioToggle from "@/components/AudioToggle";
import OnboardingModal from "@/components/OnboardingModal";
import { playChoice, startAudioOnFirstInteraction } from "@/lib/audio";
import { switchToGalileo } from "@/lib/og-chain";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

function LandingContent() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);

  const startAudio = useCallback(() => {
    if (!audioStarted) { startAudioOnFirstInteraction(); setAudioStarted(true); }
  }, [audioStarted]);

  if (loading) return <LoadingScreen onComplete={() => setLoading(false)} />;

  return (
    <div className="min-h-screen flex flex-col relative" onClick={startAudio}>
      <Cursor />
      <ScanlineOverlay />
      <AudioToggle />
      <OnboardingModal />

      {/* Header */}
      <header className="flex items-center justify-between p-4 sm:p-6 relative z-50">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 sm:gap-3">
          <span className="font-display text-xs text-noir-muted tracking-[0.3em] uppercase">Zero Cup 2026</span>
          <span className="w-1 h-1 bg-noir-accent/50 rounded-full" />
          <span className="font-body text-[10px] text-noir-muted/50">0G Labs</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <WalletButton />
        </motion.div>
      </header>

      {/* ═══ HERO SECTION ═══ */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 relative -mt-6">
        {/* Skull */}
        <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2 }}
          className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] md:w-[300px] md:h-[300px] relative">
          <Skull3D className="w-full h-full" scene="void" />
          <div className="absolute inset-0 -z-10 bg-noir-accent/5 rounded-full blur-[60px] scale-[2]" />
        </motion.div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }} className="text-center mt-4">
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-noir-text text-shadow-noir tracking-[0.15em]">
            <GlitchText text="¿QUIÉN ERES?" intensity="medium" />
          </h1>
          <motion.div initial={{ width: 0 }} animate={{ width: "100%" }}
            transition={{ delay: 1.5, duration: 1.5 }}
            className="h-[1px] bg-gradient-to-r from-transparent via-noir-accent/50 to-transparent mx-auto mt-4 max-w-[250px]" />
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 2 }}
            className="font-body text-noir-text/60 text-xs sm:text-sm max-w-md mx-auto mt-4 leading-relaxed">
            Tus recuerdos están en algún lugar. La IA los encontrará.
            La blockchain los guardará para siempre.
          </motion.p>
        </motion.div>

        {/* CTA Button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
          className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
          {!isConnected && (
            <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
              className="font-body text-[10px] text-noir-accent tracking-wider">
              Conecta tu wallet para despertar
            </motion.p>
          )}
          <motion.button
            onClick={() => { if (isConnected) { playChoice(); router.push("/game"); } }}
            disabled={!isConnected}
            whileHover={isConnected ? { scale: 1.05 } : {}}
            whileTap={isConnected ? { scale: 0.97 } : {}}
            animate={isConnected ? {
              boxShadow: ["0 0 10px rgba(212,162,68,0.2)", "0 0 25px rgba(212,162,68,0.5)", "0 0 10px rgba(212,162,68,0.2)"],
            } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className={`px-10 sm:px-14 py-3.5 sm:py-4 border-2 font-display text-sm sm:text-base tracking-[0.25em] transition-all uxpm-press ${
              isConnected
                ? "border-noir-accent bg-noir-accent/15 text-noir-accent hover:bg-noir-accent/25"
                : "border-noir-border bg-noir-card/30 text-noir-muted/50 cursor-not-allowed"
            }`}>
            DESPERTAR
          </motion.button>
          <div className="flex items-center gap-4 mt-3">
            <button onClick={() => router.push("/speedrun")} className="font-body text-[10px] text-red-400/60 hover:text-red-400 transition-colors">⚡ Modo Speedrun</button>
            <button onClick={() => router.push("/trailer")} className="font-body text-[10px] text-noir-muted/50 hover:text-noir-accent transition-colors">Ver trailer →</button>
            <button onClick={() => router.push("/world")} className="font-body text-[10px] text-noir-muted/50 hover:text-noir-accent transition-colors">Mapa global →</button>
          </div>
        </motion.div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="px-4 sm:px-8 py-12 sm:py-16 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {[
            { num: "01", title: "La IA Recuerda", desc: "Claude genera fragmentos de memoria únicos basados en tus decisiones" },
            { num: "02", title: "0G Los Guarda", desc: "Cada recuerdo se graba permanentemente en la blockchain de 0G" },
            { num: "03", title: "Tú Decides", desc: "5 actos, 5 decisiones. Cada elección define quién fuiste" },
          ].map((item, i) => (
            <motion.div key={item.num} initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
              className="text-center sm:text-left">
              <span className="font-mono text-noir-accent text-xs tracking-wider">{item.num}</span>
              <h3 className="font-display text-noir-text text-sm mt-2 mb-2 tracking-wider">{item.title}</h3>
              <p className="font-body text-noir-muted text-[11px] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ═══ WALLET SETUP — siempre visible ═══ */}
      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="px-4 sm:px-8 py-10 max-w-2xl mx-auto w-full">
        <h2 className="font-display text-sm text-noir-accent tracking-[0.2em] text-center mb-6">
          {isConnected ? "Links útiles" : "Cómo empezar"}
        </h2>

        {/* Links directos siempre visibles */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-noir-accent/60 hover:border-noir-accent hover:bg-noir-accent/10 transition-all text-noir-accent font-display text-xs tracking-wider">
            🦊 Instalar MetaMask
          </a>
          <a href="https://faucet.0g.ai" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-green-700/60 hover:border-green-500 hover:bg-green-900/10 transition-all text-green-400 font-display text-xs tracking-wider">
            💰 Obtener A0GI gratis
          </a>
          <button onClick={() => switchToGalileo()}
            className="flex items-center gap-2 px-4 py-2.5 border-2 border-blue-700/60 hover:border-blue-400 hover:bg-blue-900/10 transition-all text-blue-400 font-display text-xs tracking-wider">
            ⛓ Añadir red 0G
          </button>
        </div>

        {!isConnected && (
        <div className="space-y-3">
          {[
            { step: "1", text: "Instala MetaMask", sub: "metamask.io — extensión de navegador", href: "https://metamask.io/download/" },
            { step: "2", text: "Añade 0G Galileo Testnet", sub: "Click aquí para añadirlo automáticamente", action: true },
            { step: "3", text: "Obtén tokens gratis", sub: "faucet.0g.ai — tokens de prueba A0GI", href: "https://faucet.0g.ai" },
            { step: "4", text: "Conecta y despierta", sub: "El botón de arriba te conecta en segundos" },
          ].map((item) => (
            <motion.div key={item.step} whileHover={{ x: 3 }}
              className="flex items-center gap-4 p-3 border border-noir-border/30 hover:border-noir-accent/30 transition-colors">
              <span className="w-7 h-7 border border-noir-accent/50 flex items-center justify-center text-noir-accent font-mono text-xs shrink-0">
                {item.step}
              </span>
              <div>
                <p className="font-display text-xs text-noir-text">{item.text}</p>
                {item.action ? (
                  <button onClick={() => switchToGalileo()}
                    className="font-body text-[10px] text-noir-accent hover:underline">
                    {item.sub}
                  </button>
                ) : item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer"
                    className="font-body text-[10px] text-noir-accent hover:underline">
                    {item.sub}
                  </a>
                ) : (
                    <p className="font-body text-[10px] text-noir-muted">{item.sub}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ═══ FOOTER ═══ */}
      <footer className="p-6 sm:p-8 border-t border-noir-border/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-body text-noir-muted/40">
            <p>Construido para Zero Cup 2026 · 0G Labs</p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/ALFA117/Mongli_Game" target="_blank" rel="noopener noreferrer"
                className="hover:text-noir-accent transition-colors">GitHub</a>
              <a href="https://chainscan-galileo.0g.ai/address/0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8"
                target="_blank" rel="noopener noreferrer" className="hover:text-noir-accent transition-colors">
                Contrato: 0x81B6...E9f8
              </a>
              <button onClick={() => router.push("/about")} className="hover:text-noir-accent transition-colors">About</button>
              <button onClick={() => router.push("/gallery")} className="hover:text-noir-accent transition-colors">Archivo</button>
              <button onClick={() => router.push("/vote")} className="hover:text-noir-accent transition-colors">Votos</button>
              <button onClick={() => router.push("/nightmare")} className="hover:text-noir-accent transition-colors opacity-30 hover:opacity-60">▓ Pesadilla</button>
              <button onClick={() => router.push("/silent")} className="hover:text-noir-accent transition-colors opacity-30 hover:opacity-60">◌ Silencioso</button>
              <button onClick={() => router.push("/judges")} className="hover:text-noir-accent transition-colors opacity-40">Judges</button>
            </div>
          </div>
          {!audioStarted && (
            <motion.p animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              className="text-center font-body text-[8px] text-noir-accent/40 mt-3 tracking-wider">
              [ click para activar audio ]
            </motion.p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Providers>
      <LandingContent />
    </Providers>
  );
}
