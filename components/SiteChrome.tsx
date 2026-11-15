"use client";

import Link from "next/link";
import { IconArrowUpRight, IconGithub, IconCheck, IconCircleDashed } from "./Icons";

export const CONTRACT = "0x81B600E7ACE4CEe5D698C39368B615A732d0E9f8";
export const EXPLORER = `https://chainscan-galileo.0g.ai/address/${CONTRACT}`;
export const REPO = "https://github.com/ALFA117/Mongli_Game";

/** Header for secondary document-style pages (no wallet, no providers needed). */
export function DocHeader({ section }: { section: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-noir-border bg-noir-bg/95">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex min-h-[44px] items-center gap-3" aria-label="Mongli, inicio">
          <span className="font-display text-[19px] font-extrabold tracking-[0.02em] text-noir-text" style={{ fontStretch: "118%" }}>
            MONGLI
          </span>
          <span className="h-4 w-px bg-noir-border" aria-hidden="true" />
          <span className="eyebrow !text-[11px]">{section}</span>
        </Link>
        <nav className="flex items-center gap-1 text-[15px]" aria-label="Navegación">
          <Link href="/about" className="btn-ghost hidden items-center rounded sm:inline-flex">Acerca de</Link>
          <Link href="/judges" className="btn-ghost hidden items-center rounded sm:inline-flex">Para jueces</Link>
          <Link href="/game" className="btn btn-secondary !min-h-[44px] !px-4 !text-[14px]">Jugar</Link>
        </nav>
      </div>
    </header>
  );
}

export function DocFooter() {
  return (
    <footer className="border-t border-noir-border">
      <div className="shell grid gap-6 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="font-display font-extrabold tracking-[0.02em] text-noir-text" style={{ fontStretch: "118%" }}>MONGLI</p>
          <p className="mt-2 max-w-[46ch] text-[14px] text-noir-muted">
            Zero Cup 2026 · 0G Labs. Proyecto de hackathon en testnet, por Edgar (@ALFA_EDG).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 text-[14px]">
          <a href={EXPLORER} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 font-mono text-[13px] text-noir-muted hover:text-noir-text">
            Contrato {CONTRACT.slice(0, 6)}…{CONTRACT.slice(-4)} <IconArrowUpRight size={14} />
          </a>
          <a href={REPO} target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 text-noir-muted hover:text-noir-text">
            <IconGithub size={16} /> GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Real vs. simulated status block, shared by landing-style pages. */
export function HonestStatus({ real, simulated }: { real: React.ReactNode; simulated: React.ReactNode }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-md border border-noir-border bg-noir-border sm:grid-cols-2">
      <div className="bg-noir-card p-6">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-noir-ok"><IconCheck size={16} /> Real en testnet</p>
        <div className="mt-2 text-[15px] text-noir-muted">{real}</div>
      </div>
      <div className="bg-noir-card p-6">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-noir-muted"><IconCircleDashed size={16} /> Aún simulado</p>
        <div className="mt-2 text-[15px] text-noir-muted">{simulated}</div>
      </div>
    </div>
  );
}

/** Two-column section: label column + content column, separated by a rule. */
export function DocSection({ id, eyebrow, title, children }: { id?: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-noir-border">
      <div className="shell grid gap-8 py-16 md:py-20 lg:grid-cols-[0.75fr_1.25fr] lg:gap-12">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="h-section mt-3 max-w-[16ch] text-noir-text">{title}</h2>
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}
