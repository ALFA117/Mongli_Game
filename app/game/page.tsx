"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Providers from "@/components/Providers";

type GamePhase = "loading" | "reading" | "choosing" | "transitioning" | "revelation";

const ACTS = [
  { name: "EL DESPERTAR", scene: "Un hotel abandonado. Hay sangre en el espejo." },
  { name: "LA CIUDAD", scene: "Un callejón bajo la lluvia. Alguien te sigue." },
  { name: "LOS DOCUMENTOS", scene: "Una oficina vacía. Tu nombre en todos los archivos." },
  { name: "EL VACÍO", scene: "No hay lugar. Solo oscuridad y una voz." },
  { name: "LA VERDAD", scene: "Todo regresa. El momento en que todo cambió." },
];

function GameContent() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [actIndex, setActIndex] = useState(0);
  const [fragmentText, setFragmentText] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [choices, setChoices] = useState<{ text: string; dark: boolean }[]>([]);
  const [toneScore, setToneScore] = useState(5);
  const [fragmentId, setFragmentId] = useState(1);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState("");
  const isGenerating = useRef(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  useEffect(() => {
    if (isConnected && phase === "loading" && !isGenerating.current) {
      generateFragment(0, []);
    }
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateFragment = useCallback(
    async (actIdx: number, prevHistory: string[]) => {
      if (isGenerating.current) return;
      isGenerating.current = true;
      setPhase("loading");
      setDisplayText("");
      setError("");

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene: ACTS[actIdx]?.scene || ACTS[0].scene,
            history: prevHistory.slice(-3).map((t, i) => ({
              id: i + 1, text: t, toneScore: 5, tags: [], traces: [],
              choiceMade: "", timestamp: Date.now(), unlocked: true,
            })),
            choice: "",
            fragmentId: fragmentId,
          }),
        });

        if (res.status === 429) {
          setError("Los recuerdos necesitan tiempo...");
          isGenerating.current = false;
          setTimeout(() => generateFragment(actIdx, prevHistory), 6000);
          return;
        }

        const data = await res.json();
        if (data.error) {
          setError("La memoria se resiste...");
          isGenerating.current = false;
          setTimeout(() => generateFragment(actIdx, prevHistory), 4000);
          return;
        }

        const text = data.fragment?.text || "La memoria parpadea en la oscuridad...";
        const score = data.fragment?.toneScore ?? 5;

        const DEFAULT_CHOICES = [
          [
            { text: "Tomar la maleta y salir", dark: true },
            { text: "Quedarte y esperar", dark: false },
          ],
          [
            { text: "Seguir al extraño", dark: true },
            { text: "Huir en dirección opuesta", dark: false },
          ],
          [
            { text: "Quemar los documentos", dark: true },
            { text: "Llevártelos contigo", dark: false },
          ],
          [
            { text: "Recordar todo", dark: true },
            { text: "Elegir olvidar", dark: false },
          ],
          [
            { text: "Aceptar quién eres", dark: true },
            { text: "Rechazar tu pasado", dark: false },
          ],
        ];

        let parsedChoices = DEFAULT_CHOICES[actIdx] || DEFAULT_CHOICES[0];
        if (data.choices && Array.isArray(data.choices) && data.choices.length >= 2) {
          parsedChoices = data.choices.map((c: { text?: string; tone?: string; id?: string }, i: number) => ({
            text: c.text || DEFAULT_CHOICES[actIdx]?.[i]?.text || "Continuar",
            dark: c.tone === "dark" || i === 0,
          }));
        }

        setFragmentText(text);
        setToneScore(score);
        setChoices(parsedChoices);
        setFragmentId((prev) => prev + 1);
        setPhase("reading");
        startTypewriter(text);
      } catch {
        setError("Error de conexión...");
        isGenerating.current = false;
        setTimeout(() => generateFragment(actIdx, prevHistory), 4000);
      } finally {
        isGenerating.current = false;
      }
    },
    [fragmentId]
  );

  const startTypewriter = (text: string) => {
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    let i = 0;
    setDisplayText("");
    typewriterRef.current = setInterval(() => {
      i++;
      setDisplayText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(typewriterRef.current);
        setTimeout(() => setPhase("choosing"), 1000);
      }
    }, 35);
  };

  const handleFragmentClick = () => {
    if (phase === "reading") {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
      setDisplayText(fragmentText);
      setTimeout(() => setPhase("choosing"), 500);
    }
  };

  const handleChoice = async (dark: boolean) => {
    if (phase !== "choosing") return;
    setPhase("transitioning");

    const newHistory = [...history, fragmentText];
    setHistory(newHistory);

    const nextActIdx = actIndex + 1;
    if (nextActIdx >= ACTS.length) {
      setPhase("revelation");
      return;
    }

    setActIndex(nextActIdx);
    await new Promise((r) => setTimeout(r, 1500));
    generateFragment(nextActIdx, newHistory);
  };

  if (phase === "revelation") {
    return (
      <div
        style={{
          minHeight: "100vh", background: "#000", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 40,
          fontFamily: "'Special Elite', serif",
        }}
      >
        <div style={{ color: "#FF1A1A", fontSize: 12, letterSpacing: "0.3em", marginBottom: 24 }}>
          MEMORIA RECUPERADA
        </div>
        <div style={{ color: "#E5DEC9", fontSize: 32, marginBottom: 16, textAlign: "center" }}>
          Has completado los 5 actos
        </div>
        <div style={{ color: "#8C8275", fontSize: 16, marginBottom: 40, textAlign: "center" }}>
          Tu identidad ha sido grabada en 0G Chain
        </div>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "transparent", border: "2px solid #B30000", color: "#E5DEC9",
            padding: "16px 40px", fontSize: 16, cursor: "pointer",
            fontFamily: "'Special Elite', serif", letterSpacing: "0.15em",
          }}
        >
          VOLVER AL INICIO
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000", fontFamily: "'Special Elite', serif", color: "#E5DEC9" }}>
      {/* HEADER */}
      <div
        style={{
          padding: "16px 24px", borderBottom: "1px solid #1a1a1a",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#000", position: "sticky", top: 0, zIndex: 50,
        }}
      >
        <div>
          <span style={{ color: "#B30000", fontSize: 20, letterSpacing: "0.2em", textShadow: "0 0 10px #FF1A1A" }}>
            MONGLI
          </span>
          <span style={{ color: "#333", margin: "0 12px" }}>·</span>
          <span style={{ color: "#555", fontSize: 13, letterSpacing: "0.1em" }}>
            {ACTS[actIndex]?.name || ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {ACTS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 20, height: 3, borderRadius: 2,
                background: i < actIndex ? "#B30000" : i === actIndex ? "#FF1A1A" : "#222",
                boxShadow: i === actIndex ? "0 0 6px #FF1A1A" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* LOADING / TRANSITIONING */}
      {(phase === "loading" || phase === "transitioning") && (
        <div
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", minHeight: "calc(100vh - 60px)", gap: 16,
          }}
        >
          {phase === "transitioning" && (
            <div style={{ color: "#333", fontSize: 14, letterSpacing: "0.3em" }}>
              ACTO {actIndex + 1} — {ACTS[actIndex]?.name || ""}
            </div>
          )}
          <div
            style={{
              color: error ? "#FF1A1A" : "#B30000", fontSize: 12, letterSpacing: "0.2em",
              animation: "pulse 1.5s infinite",
            }}
          >
            {error || (phase === "transitioning" ? "· · ·" : "RECUPERANDO MEMORIA...")}
          </div>
        </div>
      )}

      {/* FRAGMENTO + CHOICES */}
      {(phase === "reading" || phase === "choosing") && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
          {/* Fragment card */}
          <div
            onClick={handleFragmentClick}
            style={{
              background: "#0d0d0d",
              border: `1px solid ${toneScore > 7 ? "#4a0000" : toneScore < 4 ? "#001a3a" : "#2a2a2a"}`,
              borderLeft: `4px solid ${toneScore > 7 ? "#B30000" : toneScore < 4 ? "#3b6fd4" : "#5a4a1a"}`,
              borderRadius: 8, padding: 28, marginBottom: 24,
              cursor: phase === "reading" ? "pointer" : "default",
              boxShadow: toneScore > 7 ? "0 0 30px rgba(179,0,0,0.15)" : "0 4px 20px rgba(0,0,0,0.8)",
            }}
          >
            <div
              style={{
                display: "flex", justifyContent: "space-between", marginBottom: 20,
                paddingBottom: 12, borderBottom: "1px solid #1a1a1a",
              }}
            >
              <span style={{ color: "#333", fontSize: 11, letterSpacing: "0.2em" }}>
                FRAGMENTO #{String(fragmentId).padStart(2, "0")} · ACTO {actIndex + 1}
              </span>
              <span style={{ color: "#222", fontSize: 11 }}>TONO {toneScore}/10</span>
            </div>

            <p style={{ color: "#E5DEC9", fontSize: 16, lineHeight: 1.9, margin: 0, minHeight: 120 }}>
              {displayText}
              {phase === "reading" && (
                <span
                  style={{
                    display: "inline-block", width: 2, height: 18, background: "#B30000",
                    marginLeft: 2, verticalAlign: "middle", animation: "blink 1s infinite",
                  }}
                />
              )}
            </p>

            {phase === "reading" && displayText.length > 20 && (
              <div
                style={{
                  marginTop: 20, paddingTop: 12, borderTop: "1px solid #1a1a1a",
                  color: "#444", fontSize: 12, letterSpacing: "0.15em", textAlign: "center",
                  animation: "pulse 2s infinite",
                }}
              >
                ▶ CLICK PARA CONTINUAR
              </div>
            )}
          </div>

          {/* CHOICES */}
          {phase === "choosing" && choices.length > 0 && (
            <div
              style={{
                background: "#080808", border: "1px solid #2a2a2a",
                borderRadius: 12, padding: 28,
              }}
            >
              <div
                style={{
                  color: "#B30000", fontSize: 11, letterSpacing: "0.25em", marginBottom: 20,
                  textShadow: "0 0 8px rgba(255,26,26,0.4)",
                }}
              >
                ¿QUÉ RECUERDAS?
              </div>

              {choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(choice.dark)}
                  style={{
                    display: "block", width: "100%", padding: "20px 24px",
                    marginBottom: i === 0 ? 12 : 0,
                    background: choice.dark ? "#1a0505" : "#05051a",
                    border: `2px solid ${choice.dark ? "#7a1515" : "#15157a"}`,
                    borderRadius: 8, color: "#E5DEC9", fontSize: 15, lineHeight: 1.6,
                    textAlign: "left", cursor: "pointer", fontFamily: "'Special Elite', serif",
                    transition: "all 0.15s ease", minHeight: 72,
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.background = choice.dark ? "#2d0808" : "#08082d";
                    el.style.borderColor = choice.dark ? "#FF1A1A" : "#4444ff";
                    el.style.boxShadow = choice.dark
                      ? "0 0 20px rgba(255,26,26,0.25)"
                      : "0 0 20px rgba(68,68,255,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.background = choice.dark ? "#1a0505" : "#05051a";
                    el.style.borderColor = choice.dark ? "#7a1515" : "#15157a";
                    el.style.boxShadow = "none";
                  }}
                >
                  <span style={{ color: choice.dark ? "#FF1A1A" : "#6666ff", fontSize: 20, marginRight: 10 }}>
                    {choice.dark ? "●" : "○"}
                  </span>
                  {choice.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:0.5 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}

export default function GamePage() {
  return (
    <Providers>
      <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
        <GameContent />
      </Suspense>
    </Providers>
  );
}
