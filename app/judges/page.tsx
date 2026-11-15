"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import { IconArrowRight, IconArrowUpRight, IconFilm, IconGithub } from "@/components/Icons";
import { DocHeader, DocFooter, DocSection, HonestStatus, CONTRACT, EXPLORER, REPO } from "@/components/SiteChrome";

type Status = "real" | "sim" | "next";

const PIPELINE: { step: string; detail: string; status: Status }[] = [
  { step: "Jugador y wallet", detail: "MetaMask vía RainbowKit / wagmi sobre 0G Galileo testnet.", status: "real" },
  { step: "Narrativa con IA", detail: "Ruta /api/generate: Claude con respaldo en Gemini y texto de reserva.", status: "real" },
  { step: "Registro del acto", detail: "Al terminar un acto o un speedrun se firma una transacción en MongliMemory.sol.", status: "real" },
  { step: "Texto en 0G Storage", detail: "lib/og-storage.ts y lib/og-chain.ts son stubs en memoria; el hash mostrado es del contenido, no una transacción.", status: "sim" },
  { step: "Inferencia en 0G Compute", detail: "Mover la narrativa de APIs centralizadas a 0G Compute.", status: "next" },
];

const BADGE: Record<Status, { label: string; cls: string }> = {
  real: { label: "Real", cls: "border-noir-ok/60 text-noir-ok" },
  sim: { label: "Simulado", cls: "border-noir-border text-noir-muted" },
  next: { label: "Siguiente", cls: "border-noir-border text-noir-faint" },
};

const STACK: [string, string][] = [
  ["Next.js 14 + TypeScript", "Framework y rutas de API"],
  ["Tailwind CSS", "Sistema visual"],
  ["Framer Motion · Three.js", "Animación y escena 3D"],
  ["Claude · Gemini", "Narrativa con respaldo"],
  ["0G Chain (Galileo)", "Registro de actos y récords"],
  ["0G Storage", "Guardado de fragmentos (simulado hoy)"],
  ["RainbowKit · wagmi · viem", "Conexión de wallet"],
  ["Web Audio API", "Banda sonora procedural"],
];

export default function JudgesPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-[100dvh] flex-col">
        <DocHeader section="Para jueces" />

        <main className="flex-1">
          {/* Summary */}
          <section className="shell grid gap-12 pb-16 pt-14 md:pb-20 md:pt-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="stamp">Ficha técnica</span>
                <span className="chip">Zero Cup 2026 · 0G Labs</span>
              </div>
              <h1 className="h-display mt-8 max-w-[18ch] text-[clamp(36px,5vw,60px)] text-noir-text">
                La IA escribe la historia. 0G registra el avance.
              </h1>
              <p className="lead mt-6">
                Juego noir de amnesia en 5 actos. Cada fragmento de memoria lo genera una IA a partir de las decisiones
                del jugador; los actos terminados y los récords de speedrun se firman en 0G Galileo testnet.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link href="/" className="btn btn-primary">Jugar <IconArrowRight /></Link>
                <Link href="/trailer" className="btn btn-secondary"><IconFilm size={16} /> Trailer, sin wallet</Link>
              </div>
            </motion.div>

            <aside className="panel-hard p-5 sm:p-6" aria-label="Contrato">
              <p className="eyebrow">Contrato desplegado</p>
              <p className="mt-3 font-display text-[20px] font-semibold text-noir-text">MongliMemory.sol</p>
              <p className="mt-2 break-all font-mono text-[14px] leading-relaxed text-noir-muted">{CONTRACT}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-noir-border pt-4 font-mono text-[13px]">
                <div><dt className="text-noir-faint">Red</dt><dd className="text-noir-text">0G Galileo</dd></div>
                <div><dt className="text-noir-faint">Tipo</dt><dd className="text-noir-text">Testnet EVM</dd></div>
              </dl>
              <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary mt-5 w-full !min-h-[44px] !text-[14px]">
                Ver en el explorador <IconArrowUpRight size={16} />
              </a>
            </aside>
          </section>

          <DocSection eyebrow="Estado de implementación" title="Qué es real hoy y qué no.">
            <HonestStatus
              real={<>Terminar un acto y guardar un récord de speedrun firman una transacción en <code className="font-mono text-[14px] text-noir-text">MongliMemory.sol</code> mediante wagmi. Se puede comprobar en la wallet después de jugar.</>}
              simulated={<>Las llamadas de &quot;0G Storage&quot; del flujo narrativo son stubs en memoria: ningún fragmento se sube todavía, y el hash que muestra el visor es del contenido, no de una transacción.</>}
            />
          </DocSection>

          <DocSection eyebrow="Arquitectura" title="Del jugador a la cadena.">
            <ol className="divide-y divide-noir-border border-y border-noir-border">
              {PIPELINE.map((p, i) => (
                <li key={p.step} className="grid grid-cols-[40px_1fr] gap-4 py-5 sm:grid-cols-[40px_1fr_auto] sm:items-start">
                  <span className="pt-0.5 font-mono text-[14px] text-noir-accent">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-noir-text">{p.step}</p>
                    <p className="mt-1 text-[15px] text-noir-muted">{p.detail}</p>
                  </div>
                  <span className={`col-start-2 w-fit rounded-full border px-2.5 py-1 font-mono text-[12px] sm:col-start-auto ${BADGE[p.status].cls}`}>
                    {BADGE[p.status].label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-[60ch] text-[15px] text-noir-muted">
              Diseño objetivo: cada fragmento se guardaría en 0G Storage y su hash se anclaría en el contrato con el
              evento <code className="font-mono text-[14px] text-noir-text">FragmentSaved</code>. Por ahora solo los actos y los récords llegan a la cadena.
            </p>
          </DocSection>

          <DocSection eyebrow="Tecnología" title="Stack.">
            <dl className="grid gap-px overflow-hidden rounded-md border border-noir-border bg-noir-border sm:grid-cols-2">
              {STACK.map(([k, v]) => (
                <div key={k} className="bg-noir-bg p-4">
                  <dt className="font-semibold text-noir-text">{k}</dt>
                  <dd className="mt-1 text-[14px] text-noir-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </DocSection>

          <DocSection eyebrow="Proceso" title="Cómo se construyó.">
            <p className="max-w-[60ch] text-noir-muted">
              Desarrollo dirigido por una persona y asistido con Claude Code, en 11 bloques: efectos visuales, motor
              narrativo, integración con la cadena, audio y experiencia de uso. El código completo es público.
            </p>
            <a href={REPO} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-6 !min-h-[44px] !text-[14px]">
              <IconGithub size={16} /> Código en GitHub
            </a>
          </DocSection>
        </main>

        <DocFooter />
      </div>
    </MotionConfig>
  );
}
