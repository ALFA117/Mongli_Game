"use client";

export default function Fragment({
  text,
  toneScore = 5,
  fragmentId = 1,
}: {
  text: string;
  toneScore?: number;
  fragmentId?: number;
}) {
  const borderColor = toneScore > 7 ? "#B3261E" : toneScore < 4 ? "#3b6fd4" : "#5a4a1a";

  return (
    <div
      style={{
        background: "#131315",
        border: "1px solid #2a2a2a",
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 8,
        padding: 24,
      }}
    >
      <div
        style={{
          color: "#333",
          fontSize: 11,
          letterSpacing: "0.2em",
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        FRAGMENTO #{String(fragmentId).padStart(2, "0")}
      </div>
      <p style={{ color: "#ECE8E1", fontSize: 15, lineHeight: 1.8, margin: 0 }}>{text}</p>
    </div>
  );
}
