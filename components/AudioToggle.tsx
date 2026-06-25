"use client";

import { useState, useCallback } from "react";
import { playAmbient, stopAmbient, isAudioStarted, startAudioOnFirstInteraction } from "@/lib/audio";

export default function AudioToggle() {
  const [active, setActive] = useState(false);

  const toggle = useCallback(async () => {
    if (!isAudioStarted()) {
      await startAudioOnFirstInteraction();
      setActive(true);
      return;
    }
    if (active) { stopAmbient(); setActive(false); }
    else { playAmbient(); setActive(true); }
  }, [active]);

  return (
    <div
      onClick={toggle}
      style={{
        position: "fixed", bottom: 16, right: 16, zIndex: 9999,
        display: "flex", alignItems: "center", gap: 8,
        background: "#0d0d0d", border: "1px solid #2a2a2a",
        borderRadius: 8, padding: "6px 12px", cursor: "pointer",
      }}
    >
      <div style={{
        width: 8, height: 8, borderRadius: "50%",
        background: active ? "#FF1A1A" : "#333",
        boxShadow: active ? "0 0 6px #FF1A1A" : "none",
        transition: "all 0.3s",
      }} />
      <span style={{
        fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase" as const,
        color: active ? "#E5DEC9" : "#444",
        fontFamily: "'Special Elite', serif",
      }}>
        {active ? "SND ON" : "SND OFF"}
      </span>
      {active && (
        <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{
              width: 2, background: "#B30000", borderRadius: 1,
              animation: `audioBar${i} 0.${5 + i}s ease-in-out infinite alternate`,
              height: 4 + i * 2,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
