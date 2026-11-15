"use client";

import { useState, useCallback } from "react";
import { motion, MotionConfig } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import AudioToggle from "@/components/AudioToggle";
import {
  IconArrowRight, IconArrowUpRight, IconTimer, IconFilm, IconGlobe, IconArchive,
  IconVote, IconMoon, IconEyeOff, IconTrophy, IconCheck, IconCircleDashed,
  IconDownload, IconLink, IconDroplet, IconGithub,
} from "@/components/Icons";
import { playChoice, startAudioOnFirstInteraction } from "@/lib/audio";
import { switchToGalileo } from "@/lib/og-chain";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const Skull3D = dynamic(() => import("@/components/Skull3D"), {
  ssr: false,
  loading: () => <div className="w-full h-full" aria-hidden="true" />,
});

const CONTRACT = "0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8";
const EXPLORER = `https://chainscan-galileo.0g.ai/address/${CONTRACT}`;

const ease = [0.22, 1, 0.36, 1] as const;
const rise = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.08 * i, duration: 0.5, ease } }),
};

const STEPS = [
  {
    n: "01",
    title: "Decides",
    body: "Despiertas en una habitación que no reconoces. En cada uno de los 5 actos eliges qué hacer, y cada elección empuja la historia hacia una identidad distinta.",
  },
  {
    n: "02",
    title: "La IA narra",
    body: "Un narrador con IA escribe el siguiente fragmento de memoria a partir de lo que elegiste. Si el servicio no responde, el juego usa texto de respaldo para no detenerse.",
  },
  {
    n: "03",
    title: "0G registra",
    body: "Con wallet, cada acto terminado y cada récord de speedrun firma una transacción real en 0G Galileo testnet.",
  },
];

const MODES = [
  { href: "/speedrun", title: "Speedrun", desc: "Contra el reloj, con tabla de récords.", Icon: IconTimer },
  { href: "/nightmare", title: "Pesadilla", desc: "Narración más oscura y 5 segundos para decidir.", Icon: IconMoon },
  { href: "/silent", title: "Silencioso", desc: "Los recuerdos como símbolos, sin texto.", Icon: IconEyeOff },
  { href: "/gallery", title: "Archivo público", desc: "Las historias de quienes despertaron antes.", Icon: IconArchive },
  { href: "/vote", title: "Fragmento de la semana", desc: "Vota el recuerdo más perturbador.", Icon: IconVote },
  { href: "/leaderboard", title: "Récords", desc: "Los más rápidos en despertar.", Icon: IconTrophy },
  { href: "/world", title: "Mapa global", desc: "Jugadores activos por región.", Icon: IconGlobe },
  { href: "/trailer", title: "Trailer", desc: "Una muestra del primer acto.", Icon: IconFilm },
];

function LandingContent() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const router = useRouter();
  const [audioStarted, setAudioStarted] = useState(false);

  const startAudio = useCallback(() => {
    if (!audioStarted) { startAudioOnFirstInteraction(); setAudioStarted(true); }
  }, [audioStarted]);

  const play = () => { playChoice(); router.push("/game"); };
  const playAsGuest = () => {
    try { sessionStorage.setItem("mongli-guest-mode", "true"); } catch { /* private mode */ }
    play();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] flex flex-col relative" onClick={startAudio}>
        <AudioToggle />

        {/* ═══ Header ═══ */}
        <header className="sticky top-0 z-50 border-b border-noir-border bg-noir-bg/95">
          <div className="shell flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 min-h-[44px]" aria-label="Mongli, inicio">
              <span className="font-display font-extrabold text-[19px] tracking-[0.02em] text-noir-text" style={{ fontStretch: "118%" }}>
                MONGLI
              </span>
              <span className="hidden sm:inline-block h-4 w-px bg-noir-border" />
              <span className="hidden sm:inline eyebrow !text-[11px]">Zero Cup 2026 · 0G Labs</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-[15px]" aria-label="Secciones">
              <a href="#como-funciona" className="btn-ghost inline-flex items-center rounded">Cómo funciona</a>
              <a href="#modos" className="btn-ghost inline-flex items-center rounded">Modos</a>
              <a href="#empezar" className="btn-ghost inline-flex items-center rounded">Empezar</a>
              <Link href="/judges" className="btn-ghost inline-flex items-center rounded">Jueces</Link>
            </nav>
            <WalletButton />
          </div>
        </header>

        <main className="flex-1">
          {/* ═══ Hero ═══ */}
          <section className="shell grid items-center gap-12 pt-14 pb-20 md:pt-20 md:pb-28 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <motion.div variants={rise} initial="hidden" animate="show" custom={0} className="flex flex-wrap items-center gap-3">
                <span className="stamp">Expediente abierto</span>
                <span className="chip"><span className="dot text-noir-accent" />0G Galileo testnet</span>
              </motion.div>

              <motion.h1 variants={rise} initial="hidden" animate="show" custom={1}
                className="h-display mt-8 text-[clamp(48px,9vw,104px)] text-noir-text">
                ¿Quién<br />eres?
              </motion.h1>

              <motion.p variants={rise} initial="hidden" animate="show" custom={2} className="lead mt-6">
                Un thriller noir de amnesia en 5 actos. Tú eliges, un narrador con IA reconstruye tus recuerdos
                y, si conectas tu wallet, cada acto queda registrado on-chain en 0G.
              </motion.p>

              <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="mt-10 flex flex-col sm:flex-row gap-3">
                {isConnected ? (
                  <button onClick={play} className="btn btn-primary">
                    Despertar <IconArrowRight />
                  </button>
                ) : (
                  <button onClick={() => openConnectModal?.()} className="btn btn-primary">
                    Conectar wallet y jugar <IconArrowRight />
                  </button>
                )}
                <button onClick={playAsGuest} className="btn btn-secondary">
                  Jugar sin cuenta
                </button>
              </motion.div>

              <motion.dl variants={rise} initial="hidden" animate="show" custom={4}
                className="mt-10 grid grid-cols-2 max-w-md border-t border-noir-border text-[14px]">
                <div className="pt-4 pr-4 border-r border-noir-border">
                  <dt className="eyebrow">Sin cuenta</dt>
                  <dd className="mt-1 text-noir-text">Actos 1 y 2</dd>
                </div>
                <div className="pt-4 pl-4">
                  <dt className="eyebrow">Con wallet</dt>
                  <dd className="mt-1 text-noir-text">5 actos + registro on-chain</dd>
                </div>
              </motion.dl>
              {isConnected && (
                <p className="mt-4 flex items-center gap-2 text-[14px] text-noir-ok">
                  <IconCheck size={16} /> Wallet conectada. Tienes el juego completo.
                </p>
              )}
            </div>

            {/* Evidence plate */}
            <motion.figure initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="frame-marks panel-hard relative mx-auto w-full max-w-[440px] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Sujeto sin identificar</span>
                <span className="font-mono text-[12px] text-noir-faint">Fig. 01</span>
              </div>
              <div className="relative mt-4 aspect-square border border-noir-border bg-noir-bg overflow-hidden">
                <div className="absolute inset-0 opacity-[0.35]" aria-hidden="true"
                  style={{ backgroundImage: "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
                <div className="absolute inset-[12%]">
                  <Skull3D className="w-full h-full" scene="void" />
                </div>
              </div>
              <figcaption className="mt-4 grid grid-cols-3 gap-3 font-mono text-[12px] leading-snug">
                <div><span className="block text-noir-faint">Memoria</span><span className="text-noir-text">0 / 15</span></div>
                <div><span className="block text-noir-faint">Actos</span><span className="text-noir-text">5</span></div>
                <div><span className="block text-noir-faint">Red</span><span className="text-noir-text">Galileo</span></div>
              </figcaption>
            </motion.figure>
          </section>

          {/* ═══ How it works ═══ */}
          <section id="como-funciona" className="border-t border-noir-border scroll-mt-16">
            <div className="shell py-20 md:py-24">
              <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="eyebrow">Cómo funciona</p>
                  <h2 className="h-section mt-3 text-noir-text max-w-[14ch]">Tres piezas, una sola historia.</h2>
                </div>
                <ol className="divide-y divide-noir-border border-y border-noir-border">
                  {STEPS.map((s) => (
                    <li key={s.n} className="grid grid-cols-[56px_1fr] gap-4 py-7">
                      <span className="font-mono text-[14px] text-noir-accent pt-1">{s.n}</span>
                      <div>
                        <h3 className="font-display text-[22px] font-semibold tracking-[-0.01em] text-noir-text">{s.title}</h3>
                        <p className="mt-2 text-noir-muted max-w-[58ch]">{s.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Honest status */}
              <div className="mt-14 grid gap-px overflow-hidden rounded-md border border-noir-border bg-noir-border sm:grid-cols-2">
                <div className="bg-noir-card p-6">
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-noir-ok"><IconCheck size={16} /> Real en testnet</p>
                  <p className="mt-2 text-[15px] text-noir-muted">Terminar un acto y guardar un récord de speedrun firman una transacción en el contrato de 0G Galileo.</p>
                </div>
                <div className="bg-noir-card p-6">
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-noir-muted"><IconCircleDashed size={16} /> Aún simulado</p>
                  <p className="mt-2 text-[15px] text-noir-muted">El guardado del texto de cada fragmento en 0G Storage todavía es simulado, y así se indica en el juego.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══ Modes ═══ */}
          <section id="modos" className="border-t border-noir-border scroll-mt-16">
            <div className="shell py-20 md:py-24">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="eyebrow">Más allá de la historia</p>
                  <h2 className="h-section mt-3 text-noir-text">Otros modos y archivos</h2>
                </div>
                <p className="text-noir-muted max-w-[40ch] text-[15px]">Todo se juega en el navegador. Los récords y votos son públicos.</p>
              </div>

              <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-noir-border bg-noir-border lg:grid-cols-4">
                {MODES.map(({ href, title, desc, Icon }) => (
                  <li key={href} className="bg-noir-bg">
                    <Link href={href}
                      className="group flex h-full min-h-[132px] flex-col justify-between gap-5 p-4 sm:p-5 transition-colors hover:bg-noir-card">
                      <div className="flex items-start justify-between">
                        <span className="text-noir-muted group-hover:text-noir-accent transition-colors"><Icon size={20} /></span>
                        <span className="text-noir-faint group-hover:text-noir-text transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                          <IconArrowUpRight size={18} />
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-noir-text">{title}</p>
                        <p className="mt-1 text-[14px] leading-snug text-noir-muted">{desc}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ═══ Getting started ═══ */}
          <section id="empezar" className="border-t border-noir-border scroll-mt-16">
            <div className="shell py-20 md:py-24 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="eyebrow">{isConnected ? "Enlaces útiles" : "Cómo empezar"}</p>
                <h2 className="h-section mt-3 text-noir-text max-w-[16ch]">
                  {isConnected ? "Todo listo para despertar." : "Cuatro pasos, todos gratis."}
                </h2>
                <p className="mt-4 text-noir-muted max-w-[44ch]">
                  Solo necesitas una wallet y tokens de prueba. No se usa dinero real: todo ocurre en la testnet de 0G.
                </p>
                {isConnected && (
                  <button onClick={play} className="btn btn-primary mt-8">Despertar <IconArrowRight /></button>
                )}
              </div>

              <ol className="grid gap-3">
                {[
                  { n: "1", title: "Instala MetaMask", sub: "Extensión de navegador o app móvil.", href: "https://metamask.io/download/", cta: "metamask.io", Icon: IconDownload },
                  { n: "2", title: "Añade 0G Galileo Testnet", sub: "Lo agregamos por ti con un clic.", action: true, cta: "Añadir red", Icon: IconLink },
                  { n: "3", title: "Pide tokens de prueba", sub: "A0GI gratis en el faucet oficial.", href: "https://faucet.0g.ai", cta: "faucet.0g.ai", Icon: IconDroplet },
                  { n: "4", title: "Conecta y despierta", sub: "Con el botón de la parte superior.", Icon: IconArrowRight },
                ].map((s) => (
                  <li key={s.n} className="panel flex items-center gap-4 p-4 sm:p-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded border border-noir-border font-mono text-[14px] text-noir-accent">
                      {s.n}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-noir-text">{s.title}</p>
                      <p className="text-[14px] text-noir-muted">{s.sub}</p>
                    </div>
                    {s.action ? (
                      <button onClick={() => switchToGalileo()} className="btn btn-secondary !min-h-[44px] !px-4 !text-[14px] shrink-0">
                        <s.Icon size={16} /><span className="hidden sm:inline">{s.cta}</span>
                      </button>
                    ) : s.href ? (
                      <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.cta}
                        className="btn btn-secondary !min-h-[44px] !px-4 !text-[14px] shrink-0">
                        <s.Icon size={16} /><span className="hidden sm:inline">{s.cta}</span>
                      </a>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </main>

        {/* ═══ Footer ═══ */}
        <footer className="border-t border-noir-border">
          <div className="shell py-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <p className="font-display font-extrabold tracking-[0.02em] text-noir-text" style={{ fontStretch: "118%" }}>MONGLI</p>
              <p className="mt-2 text-[14px] text-noir-muted max-w-[46ch]">
                Construido para Zero Cup 2026 · 0G Labs. Proyecto de hackathon en testnet.
              </p>
              <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 font-mono text-[13px] text-noir-muted hover:text-noir-text">
                Contrato {CONTRACT.slice(0, 6)}…{CONTRACT.slice(-4)} <IconArrowUpRight size={14} />
              </a>
            </div>
            <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-8 text-[14px] sm:grid-cols-3">
              {[
                ["/about", "Acerca de"], ["/gallery", "Archivo"], ["/vote", "Votos"],
                ["/leaderboard", "Récords"], ["/history", "Mi expediente"], ["/judges", "Para jueces"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="inline-flex min-h-[44px] items-center text-noir-muted hover:text-noir-text">{label}</Link>
              ))}
              <a href="https://github.com/ALFA117/Mongli_Game" target="_blank" rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 text-noir-muted hover:text-noir-text">
                <IconGithub size={16} /> GitHub
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

export default function Home() {
  return (
    <Providers>
      <LandingContent />
    </Providers>
  );
}
