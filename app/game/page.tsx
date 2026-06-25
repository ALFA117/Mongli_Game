"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Cursor from "@/components/Cursor";
import Providers from "@/components/Providers";
import WalletButton from "@/components/WalletButton";
import FragmentComponent from "@/components/Fragment";
import Toast from "@/components/Toast";
import ScanlineOverlay from "@/components/ScanlineOverlay";
import AudioToggle from "@/components/AudioToggle";
import GlitchText from "@/components/GlitchText";
import { initAudio, playChainConfirm, playChoice, playDiscovery, setAct as setAudioAct, startAudioOnFirstInteraction, startMelodicLayer, stopMelodicLayer, setTensionLevel, updateMusicWithTone } from "@/lib/audio";
import { useChainWrite } from "@/lib/useChainWrite";
import { ACTS } from "@/lib/types";
import type { Fragment, ActRecord, GenerateResponse } from "@/lib/types";
import { useAccount } from "wagmi";
import type { GameSaveState } from "@/lib/types";
import { buildPlayerProfile } from "@/lib/types";

const Skull3D = dynamic(() => import("@/components/Skull3D"), { ssr: false });

type GamePhase = "loading-save" | "found-save" | "transition" | "fragments" | "decision" | "revelation";

function GameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewGamePlus = searchParams.get("ng") === "true";
  const { isConnected, address } = useAccount();
  const chainWrite = useChainWrite();

  // Core game state
  const [currentActIdx, setCurrentActIdx] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("transition");
  const [actFragments, setActFragments] = useState<Fragment[]>([]);
  const [fragIdx, setFragIdx] = useState(0);
  const [allFragments, setAllFragments] = useState<Fragment[]>([]);
  const [actRecords, setActRecords] = useState<ActRecord[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fragmentDone, setFragmentDone] = useState(false);
  const [aiModel, setAiModel] = useState<string>("demo");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; hash?: string; visible: boolean }>({
    message: "", visible: false,
  });
  const [storageFallback, setStorageFallback] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savedState, setSavedState] = useState<GameSaveState | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout>>();
  const generatingGuard = useRef(false);

  const act = ACTS[Math.min(currentActIdx, ACTS.length - 1)];
  const totalActs = ACTS.length;
  const progressPercent = ((currentActIdx) / totalActs) * 100 + (fragIdx / 3) * (100 / totalActs);

  // Audio init on first interaction
  useEffect(() => {
    initAudio();
    if (address) fetch("/api/world", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wallet: address }) }).catch(() => {});
    const start = () => { startAudioOnFirstInteraction(); setTimeout(startMelodicLayer, 3000); };
    document.addEventListener("click", start, { once: true });
    document.addEventListener("touchstart", start, { once: true });
    return () => { document.removeEventListener("click", start); document.removeEventListener("touchstart", start); };
  }, []);

  // Redirect if no wallet
  useEffect(() => {
    if (!isConnected && allFragments.length === 0) router.push("/");
  }, [isConnected, allFragments.length, router]);

  // Sync audio drone with act
  useEffect(() => {
    const audioAct = currentActIdx < 2 ? 1 : currentActIdx < 4 ? 2 : 3;
    setAudioAct(phase === "revelation" ? "revelation" : audioAct as 1 | 2 | 3);
    setTensionLevel(currentActIdx + 1);
    if (phase === "revelation") stopMelodicLayer();
  }, [currentActIdx, phase]);

  // Load save on mount
  useEffect(() => {
    if (!address) return;
    setPhase("loading-save");
    fetch(`/api/save?wallet=${address}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.exists && data.currentAct > 0) {
          setSavedState(data as GameSaveState);
          setPhase("found-save");
        } else {
          setPhase("transition");
          setTimeout(() => startActFragments(), 2500);
        }
      })
      .catch(() => {
        setPhase("transition");
        setTimeout(() => startActFragments(), 2500);
      });
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save after each completed act
  const saveProgress = useCallback(async () => {
    if (!address) return;
    setSaveStatus("saving");
    try {
      const state: GameSaveState = {
        version: "1.0",
        walletAddress: address,
        currentAct: currentActIdx + 1,
        completedActs: actRecords,
        playerProfile: buildPlayerProfile(allFragments),
        unlockedAchievements: [],
        totalFragments: allFragments.length,
        aiModel: aiModel as "claude" | "gemini" | "demo",
        startedAt: actRecords[0]?.timestamp ? new Date(actRecords[0].timestamp).toISOString() : new Date().toISOString(),
        lastPlayedAt: new Date().toISOString(),
      };
      await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address, gameState: state }),
      });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    }
  }, [address, currentActIdx, actRecords, allFragments, aiModel]);

  // Restore from save
  const restoreSave = useCallback(() => {
    if (!savedState) return;
    setCurrentActIdx(savedState.currentAct);
    setActRecords(savedState.completedActs);
    setAllFragments(savedState.completedActs.flatMap((a) => a.fragments));
    setAiModel(savedState.aiModel);
    setPhase("transition");
    setTimeout(() => startActFragments(), 2500);
  }, [savedState]); // eslint-disable-line react-hooks/exhaustive-deps

  // New game (delete save)
  const startNewGame = useCallback(async () => {
    if (address) await fetch(`/api/save?wallet=${address}`, { method: "DELETE" }).catch(() => {});
    setSavedState(null);
    setPhase("transition");
  }, [address]);

  // When phase becomes "transition" (from restore/new), auto-start fragments
  const transitionCount = useRef(0);
  useEffect(() => {
    if (phase !== "transition") return;
    transitionCount.current++;
    if (transitionCount.current <= 1) return; // Skip first (handled by load save)
    const t = setTimeout(() => startActFragments(), 2500);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate one fragment from the API
  const generateOneFragment = useCallback(async (fragmentNum: number, choiceText: string = ""): Promise<Fragment | null> => {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: act.sceneDescription,
          history: allFragments,
          choice: choiceText,
          fragmentId: allFragments.length + fragmentNum + 1,
        }),
      });

      if (response.status === 429) {
        const data = await response.json();
        setToast({ message: `Espera ${data.retryAfter || 3}s`, visible: true });
        return null;
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || "Error generando fragmento");
      }

      const data = await response.json() as GenerateResponse & { aiModel?: string; storageFallback?: boolean };
      setAiModel(data.aiModel || "demo");
      if (data.storageFallback) setStorageFallback(true);
      return data.fragment;
    } catch (err) {
      console.error(err);
      return null;
    }
  }, [act, allFragments]);

  // Start generating the 3 fragments for current act
  const startActFragments = useCallback(async () => {
    if (generatingGuard.current) return;
    generatingGuard.current = true;
    setPhase("fragments");
    setActFragments([]);
    setFragIdx(0);
    setFragmentDone(false);
    setIsGenerating(true);
    setError(null);

    const frags: Fragment[] = [];

    for (let i = 0; i < 3; i++) {
      const frag = await generateOneFragment(i);
      if (frag) {
        frags.push(frag);
        setActFragments([...frags]);
        if (i === 0) {
          setFragIdx(0);
          setIsGenerating(false);
        }
        playDiscovery();
        if (frag) updateMusicWithTone(frag.toneScore);
      } else {
        // Use a placeholder if generation fails
        frags.push({
          id: allFragments.length + i + 1,
          text: "La memoria se resiste. Fragmentos de un recuerdo que no termina de formarse...",
          toneScore: 5, tags: ["niebla"], traces: [],
          choiceMade: "", timestamp: Date.now(), unlocked: true,
        });
        setActFragments([...frags]);
        if (i === 0) { setFragIdx(0); setIsGenerating(false); }
      }
    }
    generatingGuard.current = false;
  }, [generateOneFragment, allFragments.length]);

  // When typewriter finishes a fragment, auto-advance after 2s
  const handleFragmentComplete = useCallback(() => {
    setFragmentDone(true);
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);

    autoAdvanceTimer.current = setTimeout(() => {
      if (fragIdx < 2 && actFragments.length > fragIdx + 1) {
        setFragIdx((prev) => prev + 1);
        setFragmentDone(false);
      } else if (fragIdx >= 2) {
        // All 3 fragments shown — show decision (or revelation for Act 5)
        if (currentActIdx >= 4) {
          setPhase("revelation");
        } else {
          setPhase("decision");
        }
      }
    }, 2000);
  }, [fragIdx, actFragments.length, currentActIdx]);

  // Click anywhere during fragments: skip typewriter OR advance to next/decision
  const handleSkipClick = useCallback(() => {
    if (phase !== "fragments") return;
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);

    if (!fragmentDone && actFragments[fragIdx]) {
      // Typewriter still running — force complete, then auto-advance quickly
      setFragmentDone(true);
      autoAdvanceTimer.current = setTimeout(() => {
        if (fragIdx < 2 && actFragments.length > fragIdx + 1) {
          setFragIdx((prev) => prev + 1);
          setFragmentDone(false);
        } else if (fragIdx >= 2) {
          if (currentActIdx >= 4) setPhase("revelation");
          else setPhase("decision");
        }
      }, 400);
    } else if (fragmentDone) {
      // Typewriter done — advance immediately on click
      if (fragIdx < 2 && actFragments.length > fragIdx + 1) {
        setFragIdx((prev) => prev + 1);
        setFragmentDone(false);
      } else if (fragIdx >= 2) {
        if (currentActIdx >= 4) setPhase("revelation");
        else setPhase("decision");
      }
    }
  }, [phase, fragmentDone, fragIdx, actFragments, currentActIdx]);

  // Handle act decision
  const handleDecision = useCallback(async (decisionText: string) => {
    playChoice();

    // Save act record
    const record: ActRecord = {
      actId: act.id,
      fragments: actFragments,
      decision: decisionText,
      timestamp: Date.now(),
      toneAverage: actFragments.length > 0
        ? actFragments.reduce((s, f) => s + f.toneScore, 0) / actFragments.length
        : 5,
    };

    // Upload to 0G Storage
    try {
      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: act.sceneDescription,
          history: [...allFragments, ...actFragments],
          choice: decisionText,
          fragmentId: allFragments.length + actFragments.length + 1,
        }),
      });
      const data = await resp.json();
      record.storageHash = data.storageHash;

      // Sign on-chain
      if (chainWrite.isConnected && chainWrite.hasContract && data.storageHash) {
        const tx = await chainWrite.saveFragment(data.storageHash, act.id);
        if (tx) record.txHash = tx;
      }

      playChainConfirm();
      setToast({
        message: `Acto ${act.id} guardado en 0G`,
        hash: record.txHash || record.storageHash,
        visible: true,
      });
    } catch {
      setToast({ message: `Acto ${act.id} guardado localmente`, visible: true });
    }

    // Save records and advance
    setActRecords((prev) => [...prev, record]);
    setAllFragments((prev) => [...prev, ...actFragments]);
    setTimeout(() => saveProgress(), 500);

    // Transition to next act
    if (currentActIdx < 4) {
      setPhase("transition");
      setCurrentActIdx((prev) => prev + 1);
      setTimeout(() => startActFragments(), 2500);
    } else {
      setPhase("revelation");
    }
  }, [act, actFragments, allFragments, chainWrite, currentActIdx, startActFragments]);

  // Tone-based background tint
  const currentFrag = actFragments[fragIdx];
  const toneTint = currentFrag
    ? currentFrag.toneScore > 7 ? "rgba(180,40,40,0.04)"
      : currentFrag.toneScore < 4 ? "rgba(60,100,180,0.04)"
      : "rgba(196,146,58,0.03)"
    : "transparent";

  return (
    <div className="min-h-screen flex flex-col relative" style={{
      background: `#080808`,
      backgroundImage: `radial-gradient(circle at 20% 50%, ${toneTint} 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,0,0,0.03) 0%, transparent 50%)`,
    }} onClick={handleSkipClick}>
      <Cursor />
      <ScanlineOverlay />
      <AudioToggle />

      {/* Wallet disconnect overlay */}
      {!isConnected && allFragments.length > 0 && (
        <div className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-6">
          <div className="uxpm-glass p-8 max-w-sm w-full text-center">
            <p className="font-display text-lg text-red-400 mb-3">La conexión se perdió</p>
            <p className="font-body text-xs text-noir-muted mb-6">
              La señal se disuelve en la oscuridad. Reconecta tu identidad para seguir recordando.
            </p>
            <WalletButton />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between p-3 sm:p-4 relative z-50" style={{
        background: "rgba(10,10,10,0.95)", borderBottom: "1px solid #1a1a1a",
        backdropFilter: "blur(10px)", position: "sticky" as const, top: 0,
      }}>
        <div className="flex items-center gap-3">
          <motion.button onClick={() => router.push("/")} whileHover={{ scale: 1.05 }}
            className="font-display text-base sm:text-lg text-noir-text tracking-[0.15em] hover:text-noir-accent transition-colors">
            <GlitchText text="MONGLI" intensity="low" />
          </motion.button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-body text-noir-muted">
            <span className="px-2 py-0.5 border border-noir-accent/50 text-noir-accent">
              Acto {act.id}: {act.title}
            </span>
            <span className={`px-1.5 py-0.5 text-[8px] font-mono border ${
              aiModel === "claude" ? "text-noir-accent border-noir-accent/40" :
              aiModel === "gemini" ? "text-blue-400 border-blue-400/40" :
              "text-noir-muted border-noir-border/40"
            }`}>
              ✦ {aiModel === "claude" ? "Claude" : aiModel === "gemini" ? "Gemini" : "Demo"}
            </span>
            {isNewGamePlus && (
              <span className="px-1.5 py-0.5 text-[8px] font-mono text-purple-400 border border-purple-500/40 tracking-wider">
                ⊕ NG+
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Save indicator */}
          <span className={`text-[8px] font-body px-1.5 py-0.5 border ${
            saveStatus === "saving" ? "text-noir-muted border-noir-border/40 animate-pulse" :
            saveStatus === "saved" ? "text-green-500 border-green-800/40" :
            saveStatus === "error" ? "text-red-400 border-red-800/40" :
            "text-noir-muted/30 border-noir-border/20"
          }`}>
            {saveStatus === "saving" ? "☁ ..." : saveStatus === "saved" ? "☁✓" : saveStatus === "error" ? "☁✗" : "☁"}
          </span>
          {storageFallback && (
            <span className="text-[8px] font-body text-yellow-500 border border-yellow-600/40 px-1.5 py-0.5">
              ⚠ local
            </span>
          )}
          <button onClick={() => router.push("/history")}
            className="px-2 py-1.5 text-[10px] font-body border border-noir-border/80 text-noir-text/60 hover:text-noir-accent hover:border-noir-accent transition-colors uxpm-press hidden sm:block">
            Mi expediente
          </button>
          <WalletButton />
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-[3px] bg-noir-border/20 relative">
        <motion.div className="absolute left-0 top-0 h-full bg-noir-accent"
          animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.8 }} />
        <div className="absolute top-0 left-0 right-0 h-full flex">
          {ACTS.map((_, i) => (
            <div key={i} className="flex-1 border-r border-noir-bg/50 last:border-r-0" />
          ))}
        </div>
      </div>

      {/* Act label bar */}
      <div className="text-center py-1.5 border-b border-noir-border/10">
        <span className="font-body text-[9px] text-noir-muted/50 tracking-[0.3em] uppercase">
          Acto {act.id} · {act.title} — {act.subtitle}
        </span>
      </div>

      {/* Main content */}
      <main style={{
        display: "grid", gridTemplateColumns: "1fr", gap: 20, padding: "20px 16px",
        minHeight: "calc(100vh - 140px)", alignItems: "start",
      }} className="game-grid">
        {/* Left: Skull3D */}
        <div style={{
          background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12,
          padding: 16, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
        }}>
          <div className="w-[200px] h-[200px] sm:w-[250px] sm:h-[250px] lg:w-[280px] lg:h-[280px]">
            <Skull3D scene={act.scene} className="w-full h-full" />
          </div>
          <p style={{ color: "#444", fontSize: 11, textAlign: "center" as const, marginTop: 8 }}>
            ● {act.title.toUpperCase()}
          </p>
        </div>

        {/* Right: Fragments & Decisions */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {/* ═══ LOADING SAVE ═══ */}
            {phase === "loading-save" && (
              <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-16">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border border-noir-accent/40 border-t-noir-accent rounded-full mx-auto mb-4" />
                <p className="font-display text-xs text-noir-muted">Buscando tus recuerdos...</p>
              </motion.div>
            )}

            {/* ═══ FOUND SAVE ═══ */}
            {phase === "found-save" && savedState && (
              <motion.div key="found" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-center py-8 max-w-sm mx-auto">
                <p className="font-body text-[9px] text-noir-muted tracking-[0.4em] uppercase mb-4">
                  Partida encontrada
                </p>
                <h3 className="font-display text-lg text-noir-accent mb-2">
                  Acto {savedState.currentAct} de 5
                </h3>
                <p className="font-body text-xs text-noir-muted mb-1">
                  {savedState.totalFragments} fragmentos · {savedState.completedActs.length} actos completados
                </p>
                <p className="font-body text-[9px] text-noir-muted/50 mb-6">
                  Último acceso: {new Date(savedState.lastPlayedAt).toLocaleDateString("es-MX")}
                </p>
                <div className="flex flex-col gap-3">
                  <motion.button onClick={restoreSave} whileHover={{ scale: 1.03 }}
                    className="px-8 py-3 border-2 border-noir-accent text-noir-accent font-display text-sm tracking-wider hover:bg-noir-accent/10 uxpm-press">
                    CONTINUAR
                  </motion.button>
                  <motion.button onClick={startNewGame} whileHover={{ scale: 1.03 }}
                    className="px-8 py-2.5 border border-noir-border text-noir-muted font-display text-xs tracking-wider hover:text-red-400 hover:border-red-800/50 uxpm-press">
                    Nueva partida
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ═══ TRANSITION SCREEN ═══ */}
            {phase === "transition" && (
              <motion.div key="trans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center lg:text-left py-12">
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 0.4, y: 0 }}
                  className="font-body text-[9px] text-noir-muted tracking-[0.5em] uppercase mb-3">
                  {currentActIdx > 0 ? "Siguiente acto" : "Comienza"}
                </motion.p>
                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="font-display text-2xl sm:text-3xl text-noir-accent tracking-wider mb-2">
                  ACTO {act.id}
                </motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.8 }}
                  className="font-display text-sm text-noir-text/70">
                  {act.title}
                </motion.p>
                <motion.div initial={{ width: 0 }} animate={{ width: "60px" }} transition={{ delay: 1.2, duration: 1 }}
                  className="h-[1px] bg-noir-accent/40 mt-4 mx-auto lg:mx-0" />
              </motion.div>
            )}

            {/* ═══ FRAGMENTS (auto-revealing) ═══ */}
            {phase === "fragments" && (
              <motion.div key="frags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Fragment counter */}
                <div className="flex items-center gap-2 mb-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`h-[2px] flex-1 transition-colors duration-500 ${
                      i < fragIdx ? "bg-noir-accent" : i === fragIdx ? "bg-noir-accent/60" : "bg-noir-border/30"
                    }`} />
                  ))}
                  <span className="text-[9px] font-body text-noir-muted/40 ml-2">{fragIdx + 1}/3</span>
                </div>

                {isGenerating && actFragments.length === 0 ? (
                  <div className="text-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-10 h-10 border border-noir-accent/40 border-t-noir-accent rounded-full mx-auto mb-4" />
                    <p className="font-display text-xs text-noir-muted animate-flicker">Recuperando memorias...</p>
                  </div>
                ) : actFragments[fragIdx] ? (
                  <FragmentComponent
                    key={`frag-${currentActIdx}-${fragIdx}`}
                    fragment={actFragments[fragIdx]}
                    onComplete={handleFragmentComplete}
                  />
                ) : (
                  <p style={{ color: "#8C8275", fontSize: 12, textAlign: "center", padding: 40 }}>
                    Esperando fragmento...
                  </p>
                )}

                {/* Skip hint — clickable */}
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: fragmentDone ? 0.7 : 0.3 }} transition={{ delay: fragmentDone ? 0 : 3 }}
                  onClick={(e) => { e.stopPropagation(); handleSkipClick(); }}
                  style={{ position: "relative", zIndex: 30, cursor: "pointer" }}
                  className="text-center mt-4 font-body text-[10px] tracking-wider block w-full py-3"
                  whileHover={{ opacity: 1 }}
                >
                  <span style={{ color: fragmentDone ? "#B30000" : "#8C8275" }}>
                    {fragmentDone ? "▶ click para avanzar" : "click para saltar"}
                  </span>
                </motion.button>
              </motion.div>
            )}

            {/* ═══ DECISION ═══ */}
            {phase === "decision" && (
              <motion.div key="decide" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ position: "relative", zIndex: 25 }}>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                  className="font-body text-[9px] text-noir-accent tracking-[0.3em] uppercase mb-6 text-center lg:text-left">
                  Esta decisión define tu historia
                </motion.p>

                <div className="flex flex-col gap-4">
                  {/* Dark choice */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                    onClick={() => handleDecision(act.decision.dark.text)}
                    data-choice-dark
                    className="p-5 sm:p-6 border-2 border-red-800/50 bg-noir-card text-left hover:border-red-600/70 hover:bg-red-950/20 transition-all uxpm-press group">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-red-400/70 font-body block mb-2">Sombra</span>
                    <p className="font-display text-sm sm:text-base text-noir-text leading-relaxed">{act.decision.dark.text}</p>
                    <p className="font-body text-[9px] text-noir-muted/40 mt-2 italic">{act.decision.dark.consequence}</p>
                  </motion.button>

                  {/* Light choice */}
                  <motion.button
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
                    onClick={() => handleDecision(act.decision.light.text)}
                    data-choice-light
                    className="p-5 sm:p-6 border-2 border-noir-accent/50 bg-noir-card text-left hover:border-noir-accent hover:bg-noir-accent/10 transition-all uxpm-press group">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-noir-accent/70 font-body block mb-2">Luz</span>
                    <p className="font-display text-sm sm:text-base text-noir-text leading-relaxed">{act.decision.light.text}</p>
                    <p className="font-body text-[9px] text-noir-muted/40 mt-2 italic">{act.decision.light.consequence}</p>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* ═══ REVELATION (Act 5 end) ═══ */}
            {phase === "revelation" && (
              <motion.div key="rev" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center lg:text-left py-8">
                <p className="font-body text-[9px] text-noir-muted tracking-[0.4em] uppercase mb-4">
                  {allFragments.length + actFragments.length} memorias recopiladas
                </p>
                <h2 className="font-display text-2xl text-noir-accent mb-4">La verdad espera</h2>
                <p className="font-body text-xs text-noir-muted/60 mb-8">
                  Todos tus recuerdos han sido grabados en 0G Storage.
                  Tus decisiones determinan quién eres.
                </p>
                <motion.button
                  onClick={() => router.push("/")}
                  whileHover={{ scale: 1.05 }}
                  className="px-8 py-3 border-2 border-purple-600/60 text-purple-400 font-display text-sm tracking-[0.2em] hover:bg-purple-900/20 uxpm-press"
                  animate={{ boxShadow: ["0 0 5px rgba(147,51,234,0.2)", "0 0 20px rgba(147,51,234,0.4)", "0 0 5px rgba(147,51,234,0.2)"] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  Revelar la verdad
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Ambient particles */}
      <ActParticles scene={act.scene} />

      <Toast message={toast.message} hash={toast.hash} visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))} />

      {/* Footer */}
      <footer style={{
        background: "rgba(10,10,10,0.95)", borderTop: "1px solid #1a1a1a",
        padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <button onClick={() => router.push("/history")}
          style={{ background: "#111", border: "1px solid #222", color: "#666", padding: "4px 10px", borderRadius: 4, fontSize: 11 }}>
          Expediente
        </button>
        <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>
          Fragmento {fragIdx + 1}/3 · Acto {act.id}
        </span>
      </footer>
    </div>
  );
}

// ─── Ambient CSS particles per act ───
function ActParticles({ scene }: { scene: string }) {
  const particles = Array.from({ length: 15 }, (_, i) => i);
  const config = {
    hotel: { char: "·", color: "#d4a244", speed: "8s" },
    alley: { char: "|", color: "#6090c0", speed: "1.5s" },
    office: { char: "0", color: "#30a030", speed: "4s" },
    void: { char: "✦", color: "#ffffff", speed: "6s" },
    archive: { char: "·", color: "#c4a070", speed: "10s" },
  }[scene] || { char: "·", color: "#d4a244", speed: "8s" };

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {particles.map((i) => (
        <div key={i} className="absolute font-mono text-[10px] animate-float"
          style={{
            color: config.color, opacity: 0.15,
            left: `${5 + Math.random() * 90}%`, top: `${Math.random() * 100}%`,
            animationDuration: config.speed, animationDelay: `${Math.random() * 5}s`,
          }}>
          {config.char}
        </div>
      ))}
    </div>
  );
}

export default function GamePage() {
  return (
    <Providers>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-noir-bg">
          <motion.p animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
            className="font-display text-noir-muted text-sm tracking-wider">Cargando...</motion.p>
        </div>
      }>
        <GameContent />
      </Suspense>
    </Providers>
  );
}
