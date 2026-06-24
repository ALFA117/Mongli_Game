"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import { INITIAL_SCENES, Fragment, GenerateResponse } from "@/lib/types";

const ACT_NAMES: Record<number, string> = { 1: "LA AMNESIA", 2: "EL DESDOBLAMIENTO", 3: "LA REVELACIÓN" };

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isConnected } = useAccount();
  const sceneId = searchParams.get("scene") || "alley";
  const scene = INITIAL_SCENES.find((s) => s.id === sceneId) || INITIAL_SCENES[0];

  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [currentNode, setCurrentNode] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [typing, setTyping] = useState(false);
  const [choiceA, setChoiceA] = useState("");
  const [choiceB, setChoiceB] = useState("");
  const [loading, setLoading] = useState(false);
  const [hash, setHash] = useState("");
  const [slowMsg, setSlowMsg] = useState(false);

  const act = currentNode < 5 ? 1 : currentNode < 12 ? 2 : 3;

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  const typeText = useCallback((text: string) => {
    setDisplayText("");
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        setTyping(false);
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const generateFragment = useCallback(async (choiceText: string = "") => {
    setLoading(true);
    setSlowMsg(false);
    setChoiceA("");
    setChoiceB("");
    setHash("");
    const slowTimer = setTimeout(() => setSlowMsg(true), 8000);
    const fragmentId = fragments.length + 1;
    const currentScene = fragmentId === 1 ? scene.description : fragments[fragments.length - 1]?.text || scene.description;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene: currentScene, choice: choiceText, history: fragments, fragment_id: fragmentId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error("Error");
      const data: GenerateResponse = await response.json();

      setFragments((prev) => [...prev, data.fragment]);
      setCurrentNode(fragmentId - 1);
      if (data.fragment.storage_hash) setHash(data.fragment.storage_hash);
      if (data.choices && data.choices.length >= 2) {
        setChoiceA(data.choices[0].text);
        setChoiceB(data.choices[1].text);
      }
      setLoading(false);
      typeText(data.fragment.text);
    } catch (e) {
      console.error(e);
      setLoading(false);
    } finally {
      clearTimeout(slowTimer);
      setSlowMsg(false);
    }
  }, [fragments, scene.description, typeText]);

  const handleChoice = (opt: string) => {
    const text = opt === "A" ? choiceA : choiceB;
    setDisplayText("");
    setChoiceA("");
    setChoiceB("");
    generateFragment(text);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Special Elite', serif", color: "#e8d5b0" }}>

      {/* BARRA TOP */}
      <div style={{ height: 48, minHeight: 48, background: "#0a0000", borderBottom: "1px solid #8B0000", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span onClick={() => router.push("/")} style={{ color: "#8B0000", fontSize: 15, cursor: "pointer", letterSpacing: 2 }}>MONGLI</span>
          <span style={{ color: "#8B0000", fontSize: 12 }}>FRAGMENTO {String(currentNode + 1).padStart(2, "0")} / 15</span>
        </div>
        <span style={{ color: "#555", fontSize: 11, letterSpacing: 2 }}>ACTO {act} — {ACT_NAMES[act]}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#0f0", fontSize: 10, opacity: 0.4 }}>● 0G ACTIVO</span>
          <WalletButton />
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ height: 2, background: "#0a0a0a", flexShrink: 0 }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, #8B0000, #C4923A)", width: `${((currentNode + 1) / 15) * 100}%`, transition: "width 0.8s" }} />
      </div>

      {/* AREA CENTRAL */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* MAPA */}
        <div style={{ width: 260, minWidth: 260, borderRight: "1px solid #1a0000", background: "#050000", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", flexShrink: 0 }}>
          <div style={{ color: "#8B0000", fontSize: 10, marginBottom: 12, letterSpacing: 3, textTransform: "uppercase" }}>Mapa de recuerdos</div>
          <svg width="220" height="380" viewBox="0 0 220 380">
            {Array.from({ length: 15 }).map((_, i) => {
              const col = i % 3;
              const row = Math.floor(i / 3);
              const x = 50 + col * 60;
              const y = 25 + row * 68;
              const isActive = i === currentNode;
              const isDone = i < currentNode;
              const prevX = i > 0 ? 50 + ((i - 1) % 3) * 60 : x;
              const prevY = i > 0 ? 25 + Math.floor((i - 1) / 3) * 68 : y;
              return (
                <g key={i}>
                  {i > 0 && <line x1={prevX} y1={prevY} x2={x} y2={y} stroke={isDone ? "#8B0000" : "#1a1a1a"} strokeWidth={isDone ? 1.5 : 0.7} />}
                  {isActive && (
                    <circle cx={x} cy={y} r={18} fill="none" stroke="#8B0000" strokeWidth={1} opacity={0.4}>
                      <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r={isActive ? 11 : 7} fill={isActive ? "#8B0000" : isDone ? "#0a0a0a" : "#0a0a0a"} stroke={isActive ? "#ff2222" : isDone ? "#C4923A" : "#222"} strokeWidth={isActive ? 2 : 1}
                    onClick={() => { if (isDone && fragments[i]) { typeText(fragments[i].text); setHash(fragments[i].storage_hash); } }}
                    style={{ cursor: isDone ? "pointer" : "default" }}
                  />
                  <text x={x} y={y + 4} textAnchor="middle" fill={isActive ? "#ff4444" : isDone ? "#C4923A" : "#333"} fontSize={9} fontFamily="monospace">{isDone ? "✓" : i + 1}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* FRAGMENTO */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#020000" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minHeight: 0 }}>
            <div style={{ background: "#080000", border: "1px solid #1a0000", borderRadius: 4, padding: 24, minHeight: 180 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 40, height: 40, border: "2px solid #1a0000", borderTop: "2px solid #8B0000", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ fontFamily: "monospace", fontSize: 12, color: "#C4923A", opacity: 0.5 }}>
                    {slowMsg ? "La memoria resiste... un momento más" : "Accediendo a memoria..."}
                  </p>
                </div>
              ) : displayText ? (
                <p style={{ fontSize: 16, lineHeight: 1.9, color: "#e8d5b0", margin: 0 }}>
                  {displayText}
                  {typing && <span style={{ animation: "blink 0.7s infinite", color: "#8B0000" }}>▌</span>}
                </p>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <button onClick={() => generateFragment()} style={{ background: "transparent", border: "1px solid #8B0000", color: "#8B0000", padding: "14px 28px", cursor: "pointer", fontFamily: "'Special Elite'", fontSize: 14, letterSpacing: 2, transition: "all 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#8B0000"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8B0000"; }}>
                    ACCEDER AL RECUERDO →
                  </button>
                </div>
              )}
            </div>

            {displayText && !typing && hash && (
              <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 11, color: "#00ff41", opacity: 0.6 }}>
                ✓ GRABADO EN 0G STORAGE — {hash.slice(0, 20)}...
              </div>
            )}

            {displayText && !typing && fragments.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {fragments[fragments.length - 1]?.tags?.map((t) => (
                  <span key={t} style={{ fontSize: 9, color: "#8B0000", border: "1px solid #1a0000", padding: "2px 6px", fontFamily: "monospace", textTransform: "uppercase", opacity: 0.5 }}>{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ELECCIONES — bottom fijo */}
      {displayText && !typing && !loading && choiceA && choiceB && currentNode < 14 && (
        <div style={{ height: 130, minHeight: 130, background: "#050000", borderTop: "1px solid #8B0000", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px", gap: 8, flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, textAlign: "center", marginBottom: 2 }}>— ELIGE TU DESTINO —</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => handleChoice("A")} style={{ flex: 1, height: 50, background: "transparent", border: "1px solid #8B0000", color: "#e8d5b0", fontFamily: "'Special Elite'", fontSize: 13, cursor: "pointer", transition: "all 0.3s", padding: "0 16px", textAlign: "left" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#8B0000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e8d5b0"; }}>
              <span style={{ fontSize: 9, color: "#8B0000", display: "block", marginBottom: 2, letterSpacing: 2 }}>OPCIÓN A</span>
              {choiceA}
            </button>
            <button onClick={() => handleChoice("B")} style={{ flex: 1, height: 50, background: "transparent", border: "1px solid #333", color: "#888", fontFamily: "'Special Elite'", fontSize: 13, cursor: "pointer", transition: "all 0.3s", padding: "0 16px", textAlign: "left" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1a0000"; e.currentTarget.style.color = "#e8d5b0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; }}>
              <span style={{ fontSize: 9, color: "#555", display: "block", marginBottom: 2, letterSpacing: 2 }}>OPCIÓN B</span>
              {choiceB}
            </button>
          </div>
        </div>
      )}

      {currentNode >= 14 && displayText && !typing && (
        <div style={{ height: 100, minHeight: 100, background: "#050000", borderTop: "1px solid #8B0000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, color: "#8B0000", margin: 0 }}>Ahora sabes quién eres.</p>
            <p style={{ fontSize: 11, color: "#C4923A", opacity: 0.4, marginTop: 4, fontFamily: "monospace" }}>15 fragmentos grabados en 0G Chain</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #8B0000; }
      `}</style>
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div style={{ width: "100vw", height: "100vh", background: "#000" }} />}>
      <GameContent />
    </Suspense>
  );
}
