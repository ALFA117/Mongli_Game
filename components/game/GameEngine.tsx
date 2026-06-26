"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Player, InputState, InteractiveObject, NPC } from "@/lib/game/gameTypes";
import { LEVELS } from "@/lib/game/levels";
import { updatePlayer, findNearbyObject, findNearbyNPC, checkDoor } from "@/lib/game/physics";
import { render, resetParticles } from "@/lib/game/renderer";

export function GameEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false, interact: false });
  const playerRef = useRef<Player>({
    x: 50, y: 400, width: 32, height: 50, velocityX: 0, velocityY: 0,
    isOnGround: false, facingRight: true, state: "idle", memoryFragments: 0, blinkTimer: 3,
  });
  const camRef = useRef({ x: 0, y: 0 });
  const levelRef = useRef(0);
  const collectedRef = useRef(new Set<string>());
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);

  const [dialogActive, setDialogActive] = useState(false);
  const [dialogText, setDialogText] = useState("");
  const [dialogSpeaker, setDialogSpeaker] = useState("");
  const [dialogDisplay, setDialogDisplay] = useState("");
  const [dialogDone, setDialogDone] = useState(false);
  const [notification, setNotification] = useState("");
  const [levelName, setLevelName] = useState(LEVELS[0].name);
  const [collected, setCollected] = useState(0);
  const [levelIdx, setLevelIdx] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const twRef = useRef<ReturnType<typeof setInterval>>();

  // Current level
  const getLevel = useCallback(() => {
    const idx = Math.min(levelRef.current, LEVELS.length - 1);
    return JSON.parse(JSON.stringify(LEVELS[idx]));
  }, []);

  const [levelData, setLevelData] = useState(getLevel);

  // Show notification
  const notify = useCallback((text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(""), 3000);
  }, []);

  // Start typewriter for dialog
  const startDialog = useCallback((speaker: string, text: string) => {
    setDialogActive(true);
    setDialogSpeaker(speaker);
    setDialogText(text);
    setDialogDisplay("");
    setDialogDone(false);
    let i = 0;
    if (twRef.current) clearInterval(twRef.current);
    twRef.current = setInterval(() => {
      i++;
      setDialogDisplay(text.slice(0, i));
      if (i >= text.length) { clearInterval(twRef.current); setDialogDone(true); }
    }, 30);
  }, []);

  const closeDialog = useCallback(() => {
    if (twRef.current) clearInterval(twRef.current);
    setDialogActive(false);
    setDialogText("");
    setDialogDisplay("");
  }, []);

  // Interact with object (calls AI API)
  const interactObject = useCallback(async (obj: InteractiveObject) => {
    obj.collected = true;
    collectedRef.current.add(obj.id);
    playerRef.current.memoryFragments++;
    setCollected(collectedRef.current.size);

    startDialog(obj.label, "RECUPERANDO MEMORIA...");
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scene: `${obj.label} en ${LEVELS[levelRef.current]?.name || ""}`,
          history: [],
          choice: "",
          fragmentId: obj.fragmentId,
        }),
      });
      const data = await res.json();
      const text = data.fragment?.text || "La memoria se resiste a emerger...";
      if (twRef.current) clearInterval(twRef.current);
      setDialogDisplay("");
      setDialogDone(false);
      let i = 0;
      twRef.current = setInterval(() => {
        i++;
        setDialogDisplay(text.slice(0, i));
        if (i >= text.length) { clearInterval(twRef.current); setDialogDone(true); }
      }, 30);
    } catch {
      if (twRef.current) clearInterval(twRef.current);
      setDialogDisplay("La memoria parpadea y se desvanece...");
      setDialogDone(true);
    } finally {
      setLoading(false);
    }

    notify("Fragmento grabado en 0G ✓");
  }, [startDialog, notify]);

  // Interact with NPC
  const interactNPC = useCallback((npc: NPC) => {
    const text = npc.dialogues[npc.currentDialogue] || npc.dialogues[0];
    startDialog(npc.name, text);
    npc.currentDialogue = Math.min(npc.currentDialogue + 1, npc.dialogues.length - 1);
  }, [startDialog]);

  // Load next level
  const loadLevel = useCallback((idx: number) => {
    if (idx >= LEVELS.length) { setGameComplete(true); return; }
    levelRef.current = idx;
    setLevelIdx(idx);
    setLevelName(LEVELS[idx].name);
    resetParticles();
    const newLevel = JSON.parse(JSON.stringify(LEVELS[idx]));
    setLevelData(newLevel);
    playerRef.current.x = 50;
    playerRef.current.y = 400;
    playerRef.current.velocityX = 0;
    playerRef.current.velocityY = 0;
    playerRef.current.memoryFragments = 0;
    // Keep global collected set — don't reset
  }, []);

  // Handle interaction key
  const handleInteract = useCallback(() => {
    if (dialogActive) { closeDialog(); return; }

    const level = levelData;
    const obj = findNearbyObject(playerRef.current, level.objects);
    if (obj && !obj.collected) { interactObject(obj); return; }

    const npc = findNearbyNPC(playerRef.current, level.npcs);
    if (npc) { interactNPC(npc); return; }

    // Check door
    const door = checkDoor(playerRef.current, level.doors, collectedRef.current);
    if (door && !door.locked) {
      notify(`Entrando al Acto ${door.leadsToLevel}...`);
      setTimeout(() => loadLevel(door.leadsToLevel - 1), 1500);
      return;
    }
  }, [dialogActive, closeDialog, levelData, interactObject, interactNPC, loadLevel, notify]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") { inputRef.current.jump = true; e.preventDefault(); }
      if (e.key === "e" || e.key === "Enter") handleInteract();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") inputRef.current.jump = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [handleInteract]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const loop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;
      timeRef.current += dt;

      if (!dialogActive) {
        updatePlayer(playerRef.current, inputRef.current, levelData.platforms, dt, timeRef.current);

        // Camera follow
        camRef.current.x += (playerRef.current.x - camRef.current.x - canvas.width / 2 + 100) * 0.08;
        camRef.current.y += (playerRef.current.y - camRef.current.y - canvas.height / 2 + 50) * 0.05;
        if (camRef.current.x < 0) camRef.current.x = 0;
      }

      const nearObj = findNearbyObject(playerRef.current, levelData.objects);
      const nearNPC = findNearbyNPC(playerRef.current, levelData.npcs);

      render(ctx, levelData, playerRef.current, camRef.current, timeRef.current, nearObj, nearNPC, collectedRef.current);

      // Check if all level objects collected — update door state
      for (const door of levelData.doors) {
        door.locked = !door.requiredObjects.every((id: string) => collectedRef.current.has(id));
      }

      // Auto-complete level 5 when all objects collected
      if (levelRef.current === 4) {
        const allDone = levelData.objects.every((o: InteractiveObject) => o.collected || collectedRef.current.has(o.id));
        if (allDone && !gameComplete) {
          setGameComplete(true);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [dialogActive, levelData, gameComplete]);

  // Game complete
  if (gameComplete) {
    return (
      <div style={{
        width: "100vw", height: "100vh", background: "#000", display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center",
        fontFamily: "'Special Elite', serif",
      }}>
        <div style={{ color: "#FF1A1A", fontSize: 12, letterSpacing: "0.3em", marginBottom: 24 }}>MEMORIA COMPLETA</div>
        <div style={{ color: "#E5DEC9", fontSize: 28, marginBottom: 16 }}>Has recordado todo</div>
        <div style={{ color: "#8C8275", fontSize: 14, marginBottom: 40, textAlign: "center", maxWidth: 400 }}>
          15 fragmentos de memoria recuperados. Tu identidad ha sido grabada permanentemente en 0G Chain.
        </div>
        <button onClick={() => window.location.href = "/"}
          style={{ background: "transparent", border: "2px solid #B30000", color: "#E5DEC9", padding: "14px 36px", fontSize: 14, cursor: "pointer", fontFamily: "'Special Elite', serif", letterSpacing: "0.15em" }}>
          VOLVER AL INICIO
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 16, left: 20, zIndex: 10 }}>
        <div style={{ color: "#B30000", fontSize: 18, letterSpacing: "0.2em", textShadow: "0 0 10px #FF1A1A", fontFamily: "'Special Elite', serif" }}>MONGLI</div>
        <div style={{ color: "#555", fontSize: 11, letterSpacing: "0.1em", marginTop: 4, fontFamily: "monospace" }}>
          ACTO {levelIdx + 1} · {levelName}
        </div>
      </div>

      <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: "#555", fontSize: 11, marginRight: 8, fontFamily: "monospace" }}>MEMORIA</span>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            border: `1px solid ${i < (collected % 3 || (collected > 0 && collected % 3 === 0 ? 3 : 0)) ? "#FF1A1A" : "#333"}`,
            background: i < (collected % 3 || (collected > 0 && collected % 3 === 0 ? 3 : 0)) ? "#FF1A1A" : "transparent",
            boxShadow: i < (collected % 3 || (collected > 0 && collected % 3 === 0 ? 3 : 0)) ? "0 0 6px #FF1A1A" : "none",
          }} />
        ))}
      </div>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 20,
          background: "rgba(0,0,0,0.9)", border: "1px solid #333", borderRadius: 4,
          padding: "8px 20px", color: "#E5DEC9", fontSize: 12, fontFamily: "monospace",
        }}>{notification}</div>
      )}

      {/* Dialog Box */}
      {dialogActive && (
        <div style={{
          position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)",
          width: "80%", maxWidth: 600, zIndex: 30,
          background: "rgba(0,0,0,0.95)", border: "1px solid #B30000", borderRadius: 4,
          padding: "20px 24px", fontFamily: "'Special Elite', serif",
          boxShadow: "0 0 30px rgba(179,0,0,0.3)",
        }}>
          <div style={{ color: "#B30000", fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>
            {dialogSpeaker} {loading && <span style={{ color: "#555" }}>...</span>}
          </div>
          <p style={{ color: "#E5DEC9", fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            {dialogDisplay}
            {!dialogDone && <span style={{ animation: "blink 1s infinite" }}>|</span>}
          </p>
          {dialogDone && (
            <div style={{ color: "#444", fontSize: 11, marginTop: 12, textAlign: "right", animation: "pulse 1.5s infinite" }}>
              [E] CONTINUAR
            </div>
          )}
        </div>
      )}

      {/* Mobile controls */}
      <div style={{
        position: "absolute", bottom: 16, left: 16, zIndex: 20, display: "flex", gap: 8,
      }} className="sm:hidden">
        {[
          { label: "←", action: () => { inputRef.current.left = true; setTimeout(() => inputRef.current.left = false, 150); } },
          { label: "→", action: () => { inputRef.current.right = true; setTimeout(() => inputRef.current.right = false, 150); } },
        ].map(btn => (
          <button key={btn.label}
            onTouchStart={() => { if (btn.label === "←") inputRef.current.left = true; else inputRef.current.right = true; }}
            onTouchEnd={() => { if (btn.label === "←") inputRef.current.left = false; else inputRef.current.right = false; }}
            style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#E5DEC9", fontSize: 20, cursor: "pointer" }}>
            {btn.label}
          </button>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20, display: "flex", gap: 8 }} className="sm:hidden">
        <button
          onTouchStart={() => inputRef.current.jump = true}
          onTouchEnd={() => inputRef.current.jump = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#E5DEC9", fontSize: 20, cursor: "pointer" }}>
          ↑
        </button>
        <button onClick={handleInteract}
          style={{ width: 56, height: 56, background: "rgba(179,0,0,0.2)", border: "1px solid #B30000", borderRadius: 8, color: "#FF1A1A", fontSize: 16, cursor: "pointer" }}>
          ⚡
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}
