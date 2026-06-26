"use client";

import dynamic from "next/dynamic";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
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
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#B30000",
          fontFamily: "'Special Elite', serif",
          letterSpacing: "0.2em",
          fontSize: 14,
        }}
      >
        INICIANDO SISTEMA...
      </div>
    ),
  }
);

function GameGuard() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  useEffect(() => {
    document.body.style.cursor = "crosshair";
    return () => { document.body.style.cursor = "none"; };
  }, []);

  if (!isConnected) return null;

  return (
    <div className="game-page" style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>
      <GameEngine />
    </div>
  );
}

export default function GamePage() {
  return (
    <Providers>
      <Suspense
        fallback={
          <div style={{ minHeight: "100vh", background: "#000" }} />
        }
      >
        <GameGuard />
      </Suspense>
    </Providers>
  );
}
