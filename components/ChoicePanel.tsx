"use client";

import { useState } from "react";
import type { Choice } from "@/lib/types";

interface ChoicePanelProps {
  choices: Choice[];
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
}

export default function ChoicePanel({ choices, onChoose, disabled }: ChoicePanelProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{
      background: "#0a0a0a", border: "2px solid #1a1a1a", borderRadius: 12, padding: 24, marginTop: 16,
    }}>
      <p style={{
        color: "#B30000", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" as const,
        marginBottom: 16, textAlign: "center" as const, fontFamily: "'Special Elite', serif",
        textShadow: "0 0 10px rgba(255,26,26,0.5)",
      }}>
        ¿Qué recuerdas?
      </p>

      {choices.map((choice) => {
        const isDark = choice.tone === "dark";
        const isHov = hovered === choice.id && !disabled;

        return (
          <button
            key={choice.id}
            onClick={() => !disabled && onChoose(choice)}
            disabled={disabled}
            onMouseEnter={() => setHovered(choice.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "block", width: "100%", padding: "18px 20px", marginBottom: 10,
              background: isHov ? (isDark ? "#2d0000" : "#00002d") : (isDark ? "#1a0000" : "#00001a"),
              border: `2px solid ${isHov ? (isDark ? "#FF1A1A" : "#3b82f6") : (isDark ? "#B30000" : "#1a3a6b")}`,
              borderRadius: 8, color: "#E5DEC9", fontSize: 15, lineHeight: 1.6,
              textAlign: "left" as const, cursor: disabled ? "not-allowed" : "pointer",
              fontFamily: "'Special Elite', serif", minHeight: 72, opacity: disabled ? 0.4 : 1,
              transition: "all 0.2s",
              boxShadow: isHov
                ? `0 0 20px ${isDark ? "rgba(255,26,26,0.3)" : "rgba(59,130,246,0.3)"}, inset 0 0 20px ${isDark ? "rgba(255,26,26,0.05)" : "rgba(59,130,246,0.05)"}`
                : "none",
            }}
          >
            <span style={{ color: isDark ? "#FF1A1A" : "#3b82f6", fontSize: 20, marginRight: 10 }}>
              {isDark ? "●" : "○"}
            </span>
            {choice.text}

            {choice.isPointOfNoReturn && (
              <span style={{
                display: "inline-block", marginLeft: 10, background: "#3d0000",
                border: "1px solid #dc2626", color: "#fca5a5", padding: "2px 8px",
                borderRadius: 4, fontSize: 11, letterSpacing: "0.1em",
              }}>SIN RETORNO</span>
            )}

            {choice.narrativeConsequence && (
              <span style={{ display: "block", fontSize: 13, color: "#8C8275", marginTop: 6, fontStyle: "italic" }}>
                {choice.narrativeConsequence}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
