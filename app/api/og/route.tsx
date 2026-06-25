import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Vignette overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {/* Skull SVG simplified */}
        <svg
          width="160"
          height="180"
          viewBox="0 0 200 230"
          fill="none"
          style={{ marginBottom: 20 }}
        >
          <path
            d="M100 15 C52 15, 20 55, 20 95 C20 125, 30 145, 44 158 L44 166 C44 172, 50 176, 58 178 L68 180 L68 188 C68 194, 74 198, 84 198 L116 198 C126 198, 132 194, 132 188 L132 180 L142 178 C150 176, 156 172, 156 166 L156 158 C170 145, 180 125, 180 95 C180 55, 148 15, 100 15Z"
            stroke="#d4a244"
            strokeWidth="3"
            fill="none"
          />
          <ellipse cx="72" cy="108" rx="18" ry="21" stroke="#d4a244" strokeWidth="2" fill="#0a0a0a" />
          <ellipse cx="128" cy="108" rx="18" ry="21" stroke="#d4a244" strokeWidth="2" fill="#0a0a0a" />
          <ellipse cx="72" cy="108" rx="6" ry="7" fill="#d4a244" opacity="0.8" />
          <ellipse cx="128" cy="108" rx="6" ry="7" fill="#d4a244" opacity="0.8" />
          <path d="M93 128 L100 146 L107 128 Z" stroke="#d4a244" strokeWidth="2" fill="none" />
          <path d="M56 162 Q58 186, 84 198 L116 198 Q142 186, 144 162" stroke="#d4a244" strokeWidth="1.5" fill="none" opacity="0.5" />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#f0e4c8",
            letterSpacing: "0.15em",
            textShadow: "0 0 40px rgba(212,162,68,0.3)",
            marginBottom: 12,
          }}
        >
          MONGLI
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 22,
            color: "#d4a244",
            letterSpacing: "0.1em",
            marginBottom: 30,
          }}
        >
          Tu memoria vive en la blockchain
        </div>

        {/* Divider */}
        <div
          style={{
            width: 120,
            height: 1,
            background: "linear-gradient(90deg, transparent, #d4a244, transparent)",
            marginBottom: 30,
          }}
        />

        {/* Badge */}
        <div
          style={{
            fontSize: 14,
            color: "#9a8a6a",
            letterSpacing: "0.3em",
            textTransform: "uppercase" as const,
          }}
        >
          Zero Cup 2026 · 0G Labs
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
