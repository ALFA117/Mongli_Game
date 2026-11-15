"use client";

import dynamic from "next/dynamic";
import { useEffect, Suspense } from "react";
import Providers from "@/components/Providers";

const GameEngine = dynamic(
  () => import("@/components/game/GameEngine").then((m) => ({ default: m.GameEngine })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.14em",
          fontSize: 13,
          textTransform: "uppercase",
        }}
      >
        Cargando acto…
      </div>
    ),
  }
);

function GameGuard() {
  useEffect(() => {
    document.body.style.cursor = "crosshair";
    return () => { document.body.style.cursor = ""; };
  }, []);

  return (
    <div className="game-page" style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <GameEngine />
    </div>
  );
}

export default function GamePage() {
  return (
    <Providers>
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", background: "var(--bg)" }} />
        }
      >
        <GameGuard />
      </Suspense>
    </Providers>
  );
}
