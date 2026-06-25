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
    <div
      style={{
        background: "rgba(15,10,10,0.95)",
        border: "1px solid #2a2a2a",
        borderRadius: 12,
        padding: 20,
        marginTop: 16,
      }}
    >
      <p style={{ color: "#666", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginBottom: 14, textAlign: "center" as const }}>
        Tu decisión
      </p>
      {choices.map((choice) => {
        const isDark = choice.tone === "dark";
        const isHov = hovered === choice.id && !disabled;
        const baseColor = isDark ? "#8b1a1a" : "#1a3a6b";
        const hoverColor = isDark ? "#dc2626" : "#3b82f6";
        const textColor = isDark ? "#f5c6c6" : "#c6d8f5";
        const hoverBg = isDark ? "#1a0a0a" : "#0a0f1a";
        const symbol = isDark ? "●" : "○";
        const symbolColor = isDark ? "#dc2626" : "#3b82f6";

        return (
          <button
            key={choice.id}
            onClick={() => !disabled && onChoose(choice)}
            disabled={disabled}
            onMouseEnter={() => setHovered(choice.id)}
            onMouseLeave={() => setHovered(null)}
            data-choice-dark={isDark || undefined}
            data-choice-light={!isDark || undefined}
            style={{
              display: "block",
              width: "100%",
              padding: "18px 22px",
              marginBottom: 10,
              background: isHov ? hoverBg : "transparent",
              border: `2px solid ${isHov ? hoverColor : baseColor}`,
              borderRadius: 8,
              color: textColor,
              fontSize: 15,
              lineHeight: 1.5,
              textAlign: "left" as const,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              fontFamily: "'Special Elite', serif",
              position: "relative" as const,
              overflow: "hidden" as const,
              opacity: disabled ? 0.4 : 1,
              boxShadow: isHov ? `0 0 20px ${isDark ? "rgba(220,38,38,0.3)" : "rgba(59,130,246,0.3)"}` : "none",
              minHeight: 64,
            }}
          >
            <span style={{ color: symbolColor, marginRight: 10, fontSize: 18 }}>{symbol}</span>
            {choice.text}

            {choice.isPointOfNoReturn && (
              <span style={{
                display: "inline-block", marginLeft: 10, background: "#3d0000",
                border: "1px solid #dc2626", color: "#fca5a5", padding: "2px 8px",
                borderRadius: 4, fontSize: 11, letterSpacing: "0.1em", verticalAlign: "middle",
              }}>
                SIN RETORNO
              </span>
            )}

            {choice.narrativeConsequence && (
              <span style={{ display: "block", fontSize: 12, color: "#666", marginTop: 8, fontStyle: "italic" }}>
                {choice.narrativeConsequence}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
