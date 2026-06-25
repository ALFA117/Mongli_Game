"use client";

import { useState, useEffect, useMemo, useRef, memo } from "react";
import type { Fragment as FragmentType } from "@/lib/types";
import { generateFragmentVisual } from "@/lib/fragment-visual";

interface FragmentProps {
  fragment: FragmentType;
  onComplete?: () => void;
}

function useVariableTypewriter(text: string) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed(""); setDone(false);
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (i >= text.length) { setDone(true); return; }
      setDisplayed(text.slice(0, i + 1));
      const ch = text[i]; i++;
      const delay = ch === "." || ch === "!" || ch === "?" ? 160 : ch === "," || ch === "—" ? 80 : 22 + Math.random() * 12;
      timeout = setTimeout(tick, delay);
    };
    timeout = setTimeout(tick, 300);
    return () => clearTimeout(timeout);
  }, [text]);

  return { displayed, done };
}

function formatRelative(ts: number): string {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h`;
}

function FragmentInner({ fragment, onComplete }: FragmentProps) {
  const { displayed, done } = useVariableTypewriter(fragment.text);
  const calledRef = useRef(false);
  const visual = useMemo(() => generateFragmentVisual(fragment), [fragment]);

  useEffect(() => {
    if (done && onComplete && !calledRef.current) {
      calledRef.current = true;
      onComplete();
    }
  }, [done, onComplete]);

  useEffect(() => { calledRef.current = false; }, [fragment.id]);

  const toneBorder = fragment.toneScore > 7 ? "#7f1d1d" : fragment.toneScore >= 4 ? "#78350f" : "#1e3a5f";
  const toneGrad = fragment.toneScore > 7
    ? "linear-gradient(135deg, #1a0505, #2d0a0a)"
    : fragment.toneScore >= 4
    ? "linear-gradient(135deg, #1a1205, #2d1f0a)"
    : "linear-gradient(135deg, #050a1a, #0a102d)";
  const toneBarColor = fragment.toneScore > 7 ? "#dc2626" : fragment.toneScore >= 4 ? "#d4a244" : "#3b82f6";

  return (
    <div style={{
      background: "#141414",
      border: "1px solid #3a3a3a",
      borderLeft: `3px solid ${toneBorder}`,
      borderRadius: 4,
      boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        background: "#1e1e1e", borderBottom: "1px solid #2a2a2a", padding: "8px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: "#666", fontSize: 11, letterSpacing: "0.15em", fontFamily: "monospace" }}>
          FRAGMENTO #{String(fragment.id).padStart(2, "0")}
          {fragment.editedByPlayer && <span style={{ color: "#d4a244", marginLeft: 6 }}>✎</span>}
        </span>
        <span style={{ color: "#444", fontSize: 11, fontFamily: "monospace" }}>
          {formatRelative(fragment.timestamp)}
        </span>
      </div>

      {/* Visual generative */}
      <div style={{ height: 80, background: toneGrad, position: "relative", overflow: "hidden" }}>
        <div dangerouslySetInnerHTML={{ __html: visual.svgContent }}
          style={{ width: "100%", height: "100%", opacity: 0.8 }} />
      </div>

      {/* Fragment text */}
      <div style={{
        background: "#111", padding: "20px 24px", minHeight: 120,
        color: "#e8d5b0", fontSize: 15, lineHeight: 1.8,
        fontFamily: "'Special Elite', serif",
      }}>
        {displayed}
        {!done && (
          <span style={{
            display: "inline-block", width: 2, height: "1em", backgroundColor: toneBarColor,
            marginLeft: 2, verticalAlign: "middle",
            animation: "blink 1s step-end infinite",
          }} />
        )}
      </div>

      {/* Metadata bar */}
      {done && (
        <div style={{
          background: "#0d0d0d", borderTop: "1px solid #222", padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 11, fontFamily: "monospace",
        }}>
          {/* Tone */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#555" }}>tono</span>
            <div style={{ width: 40, height: 3, background: "#222", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${(fragment.toneScore / 10) * 100}%`, height: "100%", background: toneBarColor }} />
            </div>
            <span style={{ color: toneBarColor }}>{fragment.toneScore}</span>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 4 }}>
            {fragment.tags.slice(0, 2).map(tag => (
              <span key={tag} style={{
                padding: "1px 6px", border: "1px solid #333", borderRadius: 3,
                color: "#888", fontSize: 10,
              }}>{tag}</span>
            ))}
          </div>

          {/* Hash */}
          {fragment.storageHash && (
            <span style={{ color: "#444", fontSize: 10 }}>
              {fragment.storageHash.slice(0, 8)}...
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const Fragment = memo(FragmentInner, (prev, next) => prev.fragment.id === next.fragment.id);
export default Fragment;
