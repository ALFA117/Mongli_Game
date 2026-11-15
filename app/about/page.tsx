"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionConfig, motion } from "framer-motion";
import { useKeyboardNav } from "@/lib/useKeyboardNav";
import { IconArrowRight } from "@/components/Icons";
import { DocHeader, DocFooter, DocSection, HonestStatus, CONTRACT, EXPLORER } from "@/components/SiteChrome";

const FLOW = [
  { n: "01", title: "Entras", body: "Con wallet juegas los 5 actos; sin cuenta, los dos primeros. La wallet es tu identidad dentro del juego." },
  { n: "02", title: "Exploras y decides", body: "Cada escena esconde fragmentos de memoria. Al final de cada acto tomas una decisión que cambia el rumbo." },
  { n: "03", title: "La IA escribe", body: "Un narrador con IA genera el siguiente fragmento a partir de tus elecciones. Si no responde, entra texto de respaldo." },
  { n: "04", title: "0G registra el acto", body: "Con wallet, terminar un acto firma una transacción en el contrato de 0G Galileo testnet." },
];

const STACK: [string, string][] = [
  ["Interfaz", "Next.js 14, TypeScript, Tailwind CSS"],
  ["Animación y 3D", "Framer Motion, Three.js con React Three Fiber"],
  ["Narrativa", "Claude (Anthropic) con respaldo en Gemini"],
  ["Cadena", "0G Chain, Galileo testnet (EVM)"],
  ["Contrato", "MongliMemory.sol (Solidity)"],
  ["Wallet", "RainbowKit, wagmi, viem"],
  ["Audio", "Web Audio API, sonido procedural"],
];

export default function AboutPage() {
  const router = useRouter();
  useKeyboardNav({ onEscape: () => router.push("/"), enabled: true });

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-[100dvh] flex-col">
        <DocHeader section="Acerca de" />

        <main className="flex-1">
          {/* Intro */}
          <section className="shell pb-16 pt-14 md:pb-20 md:pt-20">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="stamp">Ficha del proyecto</span>
              <h1 className="h-display mt-8 max-w-[14ch] text-[clamp(40px,7vw,80px)] text-noir-text">
                Un thriller de amnesia con memoria <span className="whitespace-nowrap">on-chain</span>.
              </h1>
              <p className="lead mt-6">
                Mongli Game es un juego narrativo noir en 5 actos. Despiertas sin recordar quién eres; tus decisiones
                y un narrador con IA reconstruyen tu identidad, y con wallet tu avance queda registrado en 0G Galileo testnet.
              </p>
              <dl className="mt-10 grid max-w-xl grid-cols-3 border-t border-noir-border text-[14px]">
                {[
                  ["Hackathon", "Zero Cup 2026"],
                  ["Organiza", "0G Labs"],
                  ["Hecho en", "México, 2026"],
                ].map(([k, v], i) => (
                  <div key={k} className={`pt-4 ${i < 2 ? "border-r border-noir-border pr-4" : ""} ${i > 0 ? "pl-4" : ""}`}>
                    <dt className="eyebrow">{k}</dt>
                    <dd className="mt-1 text-noir-text">{v}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </section>

          <DocSection eyebrow="Recorrido" title="Cómo se juega.">
            <ol className="divide-y divide-noir-border border-y border-noir-border">
              {FLOW.map((s) => (
                <li key={s.n} className="grid grid-cols-[48px_1fr] gap-4 py-6">
                  <span className="pt-1 font-mono text-[14px] text-noir-accent">{s.n}</span>
                  <div>
                    <h3 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-noir-text">{s.title}</h3>
                    <p className="mt-2 max-w-[58ch] text-noir-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </DocSection>

          <DocSection eyebrow="Por qué 0G" title="La premisa necesita una memoria que no dependa de nadie.">
            <p className="max-w-[60ch] text-noir-muted">
              El juego trata de recuerdos que alguien intenta borrar. Por eso el avance del jugador se ancla en una
              cadena pública y no en un servidor propio. Esto es lo que funciona hoy y lo que todavía falta:
            </p>
            <div className="mt-8">
              <HonestStatus
                real={<>Terminar un acto y guardar un récord de speedrun firman una transacción en el contrato de 0G Galileo testnet.</>}
                simulated={<>El texto de cada fragmento aún no se sube a 0G Storage; ese guardado es simulado y el juego lo indica.</>}
              />
            </div>
            <p className="mt-6 max-w-[60ch] text-[15px] text-noir-muted">
              Objetivo: guardar el texto completo de cada fragmento en 0G Storage y anclar su hash en el contrato,
              para que cualquiera pueda verificarlo.
            </p>
          </DocSection>

          <DocSection eyebrow="Tecnología" title="Stack.">
            <dl className="divide-y divide-noir-border border-y border-noir-border">
              {STACK.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                  <dt className="eyebrow pt-0.5">{k}</dt>
                  <dd className="text-noir-text">{v}</dd>
                </div>
              ))}
              <div className="grid gap-1 py-4 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="eyebrow pt-0.5">Dirección</dt>
                <dd>
                  <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
                    className="break-all font-mono text-[14px] text-noir-text underline decoration-noir-border underline-offset-4 hover:decoration-noir-text">
                    {CONTRACT}
                  </a>
                </dd>
              </div>
            </dl>
          </DocSection>

          <section className="border-t border-noir-border">
            <div className="shell flex flex-col gap-6 py-16 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="h-section text-noir-text">¿Listo para despertar?</h2>
                <p className="mt-2 text-noir-muted">Los dos primeros actos no necesitan cuenta.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/" className="btn btn-primary">Ir al inicio <IconArrowRight /></Link>
                <Link href="/judges" className="btn btn-secondary">Ficha técnica</Link>
              </div>
            </div>
          </section>
        </main>

        <DocFooter />
      </div>
    </MotionConfig>
  );
}
