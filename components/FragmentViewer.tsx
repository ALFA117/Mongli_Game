"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Fragment } from "@/lib/types";

interface FragmentViewerProps {
  fragment: Fragment | null;
  allFragments?: Fragment[];
  visible: boolean;
  onClose: () => void;
  onNavigate?: (id: number) => void;
  onTxLinkClick?: () => void;
}

function useSlowTypewriter(text: string, active: boolean) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!active) {
      setDisplayed(text);
      setDone(true);
      return;
    }
    setDisplayed("");
    setDone(false);
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      if (i >= text.length) {
        setDone(true);
        return;
      }
      setDisplayed(text.slice(0, i + 1));
      const char = text[i];
      i++;
      let delay = 35;
      if (char === "." || char === "!" || char === "?") delay = 220;
      else if (char === "," || char === ";" || char === "—") delay = 100;
      else if (char === " ") delay = 30;
      timeout = setTimeout(tick, delay);
    };

    timeout = setTimeout(tick, 500);
    return () => clearTimeout(timeout);
  }, [text, active]);

  return { displayed, done };
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getToneStyle(score: number) {
  if (score >= 8)
    return { color: "#dc2626", glowClass: "uxpm-glow-red", label: "perturbador" };
  if (score >= 5)
    return { color: "#c4923a", glowClass: "uxpm-glow-amber", label: "neutro" };
  return { color: "#3b82f6", glowClass: "uxpm-glow-blue", label: "esperanza" };
}

function findRelatedFragments(
  fragment: Fragment,
  allFragments: Fragment[]
): Fragment[] {
  if (!allFragments.length) return [];
  const myTags = new Set(fragment.tags);
  return allFragments
    .filter((f) => f.id !== fragment.id && f.unlocked)
    .map((f) => ({
      fragment: f,
      shared: f.tags.filter((t) => myTags.has(t)).length,
    }))
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, 4)
    .map((r) => r.fragment);
}

async function generateShareImage(fragment: Fragment): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const W = 600;
  const H = 400;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Polaroid border
  ctx.fillStyle = "#111111";
  ctx.fillRect(30, 30, W - 60, H - 60);
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Tape
  ctx.fillStyle = "rgba(196,146,58,0.15)";
  ctx.fillRect(W / 2 - 40, 26, 80, 8);

  // Fragment number
  ctx.fillStyle = "#c4923a";
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText(`#${String(fragment.id).padStart(2, "0")}`, 45, 55);

  // Tone badge
  const tone = getToneStyle(fragment.toneScore);
  ctx.fillStyle = tone.color;
  ctx.fillText(`${tone.label} ${fragment.toneScore}/10`, W - 170, 55);

  // Fragment text — word wrap
  ctx.fillStyle = "#e8d5b0";
  ctx.font = '14px "Georgia", serif';
  const maxW = W - 100;
  const words = fragment.text.split(" ");
  let line = "";
  let y = 85;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), 50, y);
      line = word + " ";
      y += 22;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), 50, y);

  // Footer
  ctx.fillStyle = "rgba(196,146,58,0.4)";
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText("MONGLI GAME — 0G Chain", 50, H - 50);
  if (fragment.txHash) {
    ctx.fillText(
      `TX: ${fragment.txHash.slice(0, 16)}...`,
      50,
      H - 38
    );
  }

  // Vignette
  const grad = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 350);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(1, "rgba(0,0,0,0.5)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export default function FragmentViewer({
  fragment,
  allFragments = [],
  visible,
  onClose,
  onNavigate,
  onTxLinkClick,
}: FragmentViewerProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareReady, setShareReady] = useState(false);
  const { displayed, done } = useSlowTypewriter(
    fragment?.text ?? "",
    visible
  );

  // Reset share state on fragment change
  useEffect(() => {
    setShareReady(false);
    setIsSharing(false);
  }, [fragment?.id]);

  const handleShare = useCallback(async () => {
    if (!fragment || isSharing) return;
    setIsSharing(true);
    try {
      const blob = await generateShareImage(fragment);
      if (!blob) return;

      const canShare = typeof navigator.share === "function" &&
        typeof navigator.canShare === "function";
      if (canShare) {
        const file = new File([blob], `mongli-fragment-${fragment.id}.png`, {
          type: "image/png",
        });
        try {
          await navigator.share({
            title: `Mongli — Fragmento #${fragment.id}`,
            files: [file],
          });
        } catch {
          // User cancelled share
        }
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mongli-fragment-${fragment.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setShareReady(true);
        setTimeout(() => setShareReady(false), 2000);
      }
    } finally {
      setIsSharing(false);
    }
  }, [fragment, isSharing]);

  const handleNavigateToRelated = useCallback(
    (id: number) => {
      onClose();
      setTimeout(() => onNavigate?.(id), 300);
    },
    [onClose, onNavigate]
  );

  if (!fragment) return null;

  const tone = getToneStyle(fragment.toneScore);
  const related = findRelatedFragments(fragment, allFragments);
  const explorerUrl = fragment.txHash
    ? `https://chainscan-galileo.0g.ai/tx/${fragment.txHash}`
    : null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center sm:items-center justify-center"
          style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              bg-noir-card border border-noir-border relative
              w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-md sm:w-full
              overflow-y-auto uxpm-smooth-scroll
              p-5 sm:p-7
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button — large on mobile */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center text-noir-muted hover:text-noir-accent transition-colors uxpm-press z-10"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Tape decoration */}
            <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-20 h-3 bg-noir-accent/12 rotate-[0.5deg]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 pr-8">
              <div className="flex items-center gap-2">
                <span className="font-body text-[10px] text-noir-muted uppercase tracking-[0.2em]">
                  Fragmento #{String(fragment.id).padStart(2, "0")}
                </span>
                <span
                  className="text-[8px] font-body uppercase tracking-wider px-1.5 py-0.5 border"
                  style={{
                    color: tone.color,
                    borderColor: `${tone.color}40`,
                    backgroundColor: `${tone.color}10`,
                  }}
                >
                  {tone.label}
                </span>
              </div>
            </div>

            {/* Fragment text with typewriter */}
            <div
              className="paper-texture p-4 sm:p-5 mb-5 border"
              style={{
                borderColor: `${tone.color}25`,
                backgroundColor: "#0d0d0d",
              }}
            >
              <p className="font-display text-xs sm:text-sm text-noir-text leading-[1.9] tracking-wide min-h-[80px]">
                {displayed}
                {!done && (
                  <motion.span
                    className="inline-block w-[2px] h-[1em] align-middle ml-[1px]"
                    style={{ backgroundColor: tone.color }}
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "steps(1)" }}
                  />
                )}
              </p>
            </div>

            {/* Metadata section */}
            <div className="space-y-3 mb-5">
              {/* Date */}
              <div className="flex items-center justify-between text-[10px] font-body">
                <span className="text-noir-muted">Fecha</span>
                <span className="text-noir-text/70">{formatDate(fragment.timestamp)}</span>
              </div>

              {/* Choice */}
              <div className="flex items-center justify-between text-[10px] font-body">
                <span className="text-noir-muted">Decisión</span>
                <span className="text-noir-text/70 max-w-[200px] text-right truncate">
                  {fragment.choiceMade || "Inicio — despertar"}
                </span>
              </div>

              {/* Tone bar */}
              <div className="flex items-center gap-2 text-[10px] font-body">
                <span className="text-noir-muted w-12 shrink-0">Tono</span>
                <div className="flex-1 h-[4px] bg-noir-border/30 relative overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full"
                    style={{ backgroundColor: tone.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(fragment.toneScore / 10) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
                <span className="font-mono" style={{ color: tone.color }}>
                  {fragment.toneScore}
                </span>
              </div>

              {/* Tags */}
              {fragment.tags.length > 0 && (
                <div className="flex items-start gap-2 text-[10px] font-body">
                  <span className="text-noir-muted w-12 shrink-0 pt-0.5">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {fragment.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 border border-noir-border/40 bg-noir-bg/30 text-noir-accent/80 text-[9px]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 0G Hashes */}
              {fragment.storageHash && (
                <div className="flex items-center justify-between text-[10px] font-body">
                  <span className="text-noir-muted">0G Storage</span>
                  <span className="text-noir-accent font-mono text-[9px]">
                    {fragment.storageHash.slice(0, 10)}...{fragment.storageHash.slice(-6)}
                  </span>
                </div>
              )}

              {fragment.txHash && (
                <div className="flex items-center justify-between text-[10px] font-body">
                  <span className="text-noir-muted">0G Chain TX</span>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-500 hover:text-green-400 font-mono text-[9px] underline underline-offset-2 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onTxLinkClick?.(); }}
                    >
                      {fragment.txHash.slice(0, 10)}...{fragment.txHash.slice(-6)}
                    </a>
                  ) : (
                    <span className="text-green-500 font-mono text-[9px]">
                      {fragment.txHash.slice(0, 10)}...
                    </span>
                  )}
                </div>
              )}

              {/* Traces */}
              {fragment.traces.length > 0 && (
                <div>
                  <span className="text-[10px] font-body text-noir-muted block mb-1">Trazas</span>
                  {fragment.traces.map((trace) => (
                    <p
                      key={trace}
                      className="text-[10px] font-body text-noir-text/50 pl-2 border-l border-noir-accent/20 mb-0.5"
                    >
                      {trace}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Related fragments */}
            {related.length > 0 && (
              <div className="border-t border-noir-border/30 pt-4 mb-5">
                <p className="text-[9px] font-body text-noir-muted uppercase tracking-wider mb-2">
                  Conecta con
                </p>
                <div className="flex flex-wrap gap-2">
                  {related.map((rf) => {
                    const rfTone = getToneStyle(rf.toneScore);
                    const sharedTags = rf.tags.filter((t) =>
                      fragment.tags.includes(t)
                    );
                    return (
                      <button
                        key={rf.id}
                        onClick={() => handleNavigateToRelated(rf.id)}
                        className="flex items-center gap-1.5 px-2 py-1 border border-noir-border/30 bg-noir-bg/30 hover:border-noir-accent/40 transition-colors uxpm-press text-left"
                      >
                        <span
                          className="w-3 h-3 rounded-full border flex items-center justify-center text-[7px]"
                          style={{
                            borderColor: rfTone.color,
                            color: rfTone.color,
                          }}
                        >
                          {rf.id}
                        </span>
                        <div>
                          <span className="text-[9px] font-body text-noir-text/60 block leading-tight">
                            #{rf.id} — {rf.text.slice(0, 30)}...
                          </span>
                          <span className="text-[7px] font-body text-noir-accent/40">
                            {sharedTags.join(", ")}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="flex-1 py-2.5 border border-noir-accent/40 text-noir-accent text-[10px] font-display tracking-wider hover:bg-noir-accent/10 transition-colors uxpm-press disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isSharing ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    &#9696;
                  </motion.span>
                ) : shareReady ? (
                  "Descargado ✓"
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                    Compartir recuerdo
                  </>
                )}
              </button>
            </div>

            {/* Twitter share */}
            <button
              onClick={() => {
                const text = encodeURIComponent(
                  `Un fragmento de mi memoria en @MongliGame:\n"${fragment.text.slice(0, 80)}..."\n\nGrabado en 0G para siempre.\nmongli-game.vercel.app #ZeroCup2026`
                );
                window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
              }}
              className="w-full py-2 border border-noir-border/40 text-noir-muted text-[10px] font-body tracking-wider hover:text-noir-accent hover:border-noir-accent/40 transition-colors uxpm-press mt-2 flex items-center justify-center gap-2"
            >
              Compartir en X/Twitter
            </button>

            {/* Copy link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(`https://mongli-game.vercel.app`);
                alert("Link copiado");
              }}
              className="w-full py-2 border border-noir-border/30 text-noir-muted/50 text-[10px] font-body tracking-wider hover:text-noir-accent transition-colors uxpm-press mt-1"
            >
              Copiar link
            </button>

            {/* Footer watermark */}
            <p className="text-[7px] font-body text-noir-muted/20 text-center mt-4 tracking-wider">
              MONGLI GAME — 0G STORAGE — PERMANENTE
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
