"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import WalletButton from "@/components/WalletButton";
import BloodCursor from "@/components/BloodCursor";
import PixelSprite from "@/components/PixelSprite";
import { audioEngine } from "@/lib/ambientAudio";
import { t, Lang } from "@/lib/i18n";
import { INITIAL_SCENES, Fragment, GenerateResponse } from "@/lib/types";

const TOTAL_FRAGMENTS = 10;

const ACT_NAMES_ES: Record<number, string> = { 1: "LA AMNESIA", 2: "EL DESDOBLAMIENTO", 3: "LA REVELACIÓN" };
const ACT_NAMES_EN: Record<number, string> = { 1: "THE AMNESIA", 2: "THE SPLIT", 3: "THE REVELATION" };

function HexNode({ x, y, size, active, done, label, onClick }: {
  x: number; y: number; size: number; active: boolean; done: boolean; label: string; onClick?: () => void;
}) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${x + size * Math.cos(angle)},${y + size * Math.sin(angle)}`;
  }).join(" ");

  return (
    <g className="hex-node" onClick={onClick} style={{ cursor: done ? "pointer" : "default" }}>
      {active && (
        <polygon points={pts} fill="none" stroke="#8B0000" strokeWidth={1} opacity={0.4}>
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
        </polygon>
      )}
      <polygon
        points={pts}
        fill={active ? "#8B0000" : done ? "#0a0a0a" : "#0a0a0a"}
        stroke={active ? "#ff2222" : done ? "#C4923A" : "#222"}
        strokeWidth={active ? 2 : 1}
      />
      <text x={x} y={y + 4} textAnchor="middle" fill={active ? "#ff4444" : done ? "#C4923A" : "#333"} fontSize={9} fontFamily="monospace">
        {done ? "✓" : label}
      </text>
    </g>
  );
}

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
  const [audioOn, setAudioOn] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [lang, setLang] = useState<Lang>("es");
  const [shadowNode, setShadowNode] = useState(8);

  const act = currentNode < 5 ? 1 : currentNode < 8 ? 2 : 3;
  const ACT_NAMES = lang === "es" ? ACT_NAMES_ES : ACT_NAMES_EN;
  const L = t[lang];

  useEffect(() => {
    const savedLang = (searchParams.get("lang") || localStorage.getItem("mongli-lang") || "es") as Lang;
    if (savedLang === "en" || savedLang === "es") setLang(savedLang);
  }, [searchParams]);

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  useEffect(() => {
    setAudioOn(audioEngine.isRunning());
    if (!audioEngine.isRunning()) {
      audioEngine.start();
      setAudioOn(true);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setShadowNode((prev) => (prev > currentNode + 1 ? prev - 1 : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, [currentNode]);

  const handleLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem("mongli-lang", l);
  };

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
    }, 8);
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

  const mapNodes = Array.from({ length: TOTAL_FRAGMENTS }, (_, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 100 : 200;
    const y = 30 + row * 70;
    return { x, y, i };
  });

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Special Elite', serif", color: "#e8d5b0" }}>
      <BloodCursor />

      {/* TOP BAR */}
      <div className="glass-panel" style={{ height: 48, minHeight: 48, borderBottom: "1px solid #8B0000", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0, borderRadius: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span onClick={() => router.push("/")} style={{ color: "#8B0000", fontSize: 15, letterSpacing: 2 }}>MONGLI</span>
          <span style={{ color: "#8B0000", fontSize: 12 }}>{L.fragment} {String(currentNode + 1).padStart(2, "0")} / {TOTAL_FRAGMENTS}</span>
        </div>
        <span style={{ color: "#555", fontSize: 11, letterSpacing: 2 }}>
          {lang === "es" ? "ACTO" : "ACT"} {act} — {ACT_NAMES[act]}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Volume */}
          <button
            onClick={() => { const on = audioEngine.toggle(); setAudioOn(on); }}
            className="font-mono text-[10px] text-red-400/40 hover:text-red-400"
            style={{ background: "none", border: "none", padding: "2px" }}
            aria-label="Toggle audio"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {audioOn ? (
                <><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>
              ) : (
                <><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
              )}
            </svg>
          </button>
          {audioOn && (
            <input type="range" min="0" max="1" step="0.01" value={volume}
              onChange={(e) => { const v = parseFloat(e.target.value); setVolume(v); audioEngine.setVolume(v); }}
              className="volume-slider" aria-label="Volume" />
          )}

          {/* Lang toggle */}
          <div className="lang-toggle">
            <button className={lang === "es" ? "active" : ""} onClick={() => handleLang("es")}>ES</button>
            <button className={lang === "en" ? "active" : ""} onClick={() => handleLang("en")}>EN</button>
          </div>

          <span style={{ color: "#0f0", fontSize: 10, opacity: 0.4 }}>● {L.chainActive}</span>
          <WalletButton />
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ height: 2, background: "#0a0a0a", flexShrink: 0 }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, #8B0000, #C4923A)", width: `${((currentNode + 1) / TOTAL_FRAGMENTS) * 100}%`, transition: "width 0.8s ease" }} />
      </div>

      {/* CENTRAL AREA */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* MAP SIDEBAR */}
        <div className="glass-panel" style={{ width: 300, minWidth: 300, borderRight: "1px solid #1a0000", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", flexShrink: 0, borderRadius: 0 }}>
          <div style={{ color: "#8B0000", fontSize: 10, marginBottom: 12, letterSpacing: 3, textTransform: "uppercase" }}>{L.map}</div>

          <svg width="300" height="400" viewBox="0 0 300 400">
            {/* Path lines */}
            {mapNodes.map((node, idx) => {
              if (idx === 0) return null;
              const prev = mapNodes[idx - 1];
              const isDone = idx < currentNode;
              return (
                <line key={`l-${idx}`} x1={prev.x} y1={prev.y} x2={node.x} y2={node.y}
                  stroke={isDone ? "#8B0000" : "#1a1a1a"} strokeWidth={isDone ? 1.5 : 0.7}
                  strokeDasharray={isDone ? "none" : "4 3"} />
              );
            })}

            {/* Hex nodes */}
            {mapNodes.map((node) => (
              <HexNode
                key={node.i}
                x={node.x}
                y={node.y}
                size={16}
                active={node.i === currentNode}
                done={node.i < currentNode}
                label={String(node.i + 1)}
                onClick={() => {
                  if (node.i < currentNode && fragments[node.i]) {
                    typeText(fragments[node.i].text);
                    setHash(fragments[node.i].storage_hash);
                  }
                }}
              />
            ))}

            {/* Detective sprite position */}
            <foreignObject x={mapNodes[Math.min(currentNode, TOTAL_FRAGMENTS - 1)].x - 20} y={mapNodes[Math.min(currentNode, TOTAL_FRAGMENTS - 1)].y + 18} width={40} height={40} style={{ transition: "all 0.8s ease" }}>
              <div style={{ animation: "sprite-idle 1.5s ease-in-out infinite" }}>
                <PixelSprite type="detective" size={40} />
              </div>
            </foreignObject>

            {/* Witness at node 3 */}
            {currentNode <= 3 && (
              <foreignObject x={mapNodes[2].x - 20} y={mapNodes[2].y - 48} width={40} height={48}>
                <div style={{ animation: "sprite-idle 1.8s ease-in-out infinite" }}>
                  <PixelSprite type="witness" size={36} />
                </div>
              </foreignObject>
            )}

            {/* Shadow approaching */}
            {shadowNode < TOTAL_FRAGMENTS && (
              <foreignObject x={mapNodes[shadowNode].x - 20} y={mapNodes[shadowNode].y - 44} width={40} height={44}>
                <div style={{ animation: "sprite-idle 2s ease-in-out infinite", transition: "all 1s ease" }}>
                  <PixelSprite type="shadow" size={36} />
                </div>
              </foreignObject>
            )}
          </svg>
        </div>

        {/* FRAGMENT AREA */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", background: "#020000" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", minHeight: 0 }}>
            <div className="glass-panel" style={{ borderRadius: 4, padding: 24, minHeight: 180 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 40, height: 40, border: "2px solid #1a0000", borderTop: "2px solid #8B0000", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                  <p style={{ fontFamily: "monospace", fontSize: 12, color: "#C4923A", opacity: 0.5 }}>
                    {slowMsg ? L.slowLoading : L.loading1}
                  </p>
                </div>
              ) : displayText ? (
                <p style={{ fontSize: 16, lineHeight: 1.9, color: "#e8d5b0", margin: 0 }}>
                  {displayText}
                  {typing && <span style={{ animation: "blink 0.7s infinite", color: "#8B0000" }}>▌</span>}
                </p>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <button
                    onClick={() => generateFragment()}
                    className="choice-btn"
                    style={{ background: "transparent", border: "1px solid #8B0000", color: "#8B0000", padding: "14px 28px", fontFamily: "'Special Elite'", fontSize: 14, letterSpacing: 2, transition: "all 0.3s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#8B0000"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#8B0000"; }}
                  >
                    {L.access}
                  </button>
                </div>
              )}
            </div>

            {displayText && !typing && hash && (
              <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: 11, color: "#00ff41", opacity: 0.6 }}>
                {L.stored} — {hash.slice(0, 20)}...
              </div>
            )}

            {displayText && !typing && fragments.length > 0 && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {fragments[fragments.length - 1]?.tags?.map((tag) => (
                  <span key={tag} style={{ fontSize: 9, color: "#8B0000", border: "1px solid #1a0000", padding: "2px 6px", fontFamily: "monospace", textTransform: "uppercase", opacity: 0.5 }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CHOICES — bottom fixed */}
      {displayText && !typing && !loading && choiceA && choiceB && currentNode < TOTAL_FRAGMENTS - 1 && (
        <div className="glass-panel" style={{ height: 130, minHeight: 130, borderTop: "1px solid #8B0000", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px", gap: 8, flexShrink: 0, borderRadius: 0 }}>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, textAlign: "center", marginBottom: 2 }}>{L.choose}</div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => handleChoice("A")} className="choice-btn" style={{ flex: 1, height: 50, background: "transparent", border: "1px solid #8B0000", color: "#e8d5b0", fontFamily: "'Special Elite'", fontSize: 13, padding: "0 16px", textAlign: "left" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#8B0000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#e8d5b0"; }}>
              <span style={{ fontSize: 9, color: "#8B0000", display: "block", marginBottom: 2, letterSpacing: 2 }}>{L.optionA}</span>
              {choiceA}
            </button>
            <button onClick={() => handleChoice("B")} className="choice-btn" style={{ flex: 1, height: 50, background: "transparent", border: "1px solid #333", color: "#888", fontFamily: "'Special Elite'", fontSize: 13, padding: "0 16px", textAlign: "left" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#1a0000"; e.currentTarget.style.color = "#e8d5b0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#888"; }}>
              <span style={{ fontSize: 9, color: "#555", display: "block", marginBottom: 2, letterSpacing: 2 }}>{L.optionB}</span>
              {choiceB}
            </button>
          </div>
        </div>
      )}

      {currentNode >= TOTAL_FRAGMENTS - 1 && displayText && !typing && (
        <div className="glass-panel" style={{ height: 100, minHeight: 100, borderTop: "1px solid #8B0000", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 0 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 22, color: "#8B0000", margin: 0 }}>{L.endTitle}</p>
            <p style={{ fontSize: 11, color: "#C4923A", opacity: 0.4, marginTop: 4, fontFamily: "monospace" }}>{TOTAL_FRAGMENTS} {L.endSub}</p>
          </div>
        </div>
      )}
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
