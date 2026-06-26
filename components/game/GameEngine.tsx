"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Player, InputState, InteractiveObject, NPC } from "@/lib/game/gameTypes";
import { LEVELS } from "@/lib/game/levels";
import { updatePlayer, findNearbyObject, findNearbyNPC, checkDoor, respawnPlayer, updateCheckpoints } from "@/lib/game/physics";
import { render, resetParticles } from "@/lib/game/renderer";

function deepCopy<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

export function GameEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false, interact: false });
  const camRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const timeRef = useRef(0);

  const [levelIdx, setLevelIdx] = useState(0);
  const [levelData, setLevelData] = useState(() => deepCopy(LEVELS[0]));
  const [player, setPlayer] = useState<Player>({
    x: 100, y: 460, width: 32, height: 50, velocityX: 0, velocityY: 0,
    isOnGround: false, facingRight: true, state: "idle", memoryFragments: 0, blinkTimer: 3,
    health: 100, maxHealth: 100, isInvincible: false, invincibleTimer: 0, isDead: false,
  });
  const playerRef = useRef(player);
  playerRef.current = player;

  const collectedRef = useRef(new Set<string>());
  const [collected, setCollected] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  // Dialog state
  const [dialogActive, setDialogActive] = useState(false);
  const [dialogSpeaker, setDialogSpeaker] = useState("");
  const [dialogDisplay, setDialogDisplay] = useState("");
  const [dialogDone, setDialogDone] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(false);
  const twRef = useRef<ReturnType<typeof setInterval>>();

  const notify = useCallback((text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(""), 3000);
  }, []);

  const startDialog = useCallback((speaker: string, text: string) => {
    setDialogActive(true);
    setDialogSpeaker(speaker);
    setDialogDisplay("");
    setDialogDone(false);
    if (twRef.current) clearInterval(twRef.current);
    let i = 0;
    twRef.current = setInterval(() => {
      i++;
      setDialogDisplay(text.slice(0, i));
      if (i >= text.length) { clearInterval(twRef.current); setDialogDone(true); }
    }, 30);
  }, []);

  const closeDialog = useCallback(() => {
    if (twRef.current) clearInterval(twRef.current);
    setDialogActive(false);
  }, []);

  const interactObject = useCallback(async (obj: InteractiveObject) => {
    obj.collected = true;
    collectedRef.current.add(obj.id);
    setCollected(collectedRef.current.size);
    startDialog(obj.label, "RECUPERANDO MEMORIA...");
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene: `${obj.label} en ${LEVELS[levelIdx]?.name}`, history: [], choice: "", fragmentId: obj.fragmentId }),
      });
      const data = await res.json();
      const text = data.fragment?.text || "La memoria se resiste...";
      if (twRef.current) clearInterval(twRef.current);
      setDialogDisplay(""); setDialogDone(false);
      let i = 0;
      twRef.current = setInterval(() => { i++; setDialogDisplay(text.slice(0, i)); if (i >= text.length) { clearInterval(twRef.current); setDialogDone(true); } }, 30);
    } catch {
      if (twRef.current) clearInterval(twRef.current);
      setDialogDisplay("La memoria parpadea..."); setDialogDone(true);
    } finally { setLoading(false); }
    notify("Fragmento grabado en 0G ✓");
  }, [startDialog, notify, levelIdx]);

  const interactNPC = useCallback((npc: NPC) => {
    startDialog(npc.name, npc.dialogues[npc.currentDialogue] || npc.dialogues[0]);
    npc.currentDialogue = Math.min(npc.currentDialogue + 1, npc.dialogues.length - 1);
  }, [startDialog]);

  const loadLevel = useCallback((idx: number) => {
    if (idx >= LEVELS.length) { setGameComplete(true); return; }
    setLevelIdx(idx);
    resetParticles();
    const newLevel = deepCopy(LEVELS[idx]);
    setLevelData(newLevel);
    setPlayer(p => ({ ...p, x: 100, y: newLevel.groundY - 60, velocityX: 0, velocityY: 0, memoryFragments: 0, health: p.maxHealth, isDead: false, isInvincible: false }));
    camRef.current = { x: 0, y: 0 };
  }, []);

  const restartLevel = useCallback(() => {
    setDeaths(d => d + 1);
    loadLevel(levelIdx);
  }, [loadLevel, levelIdx]);

  const handleInteract = useCallback(() => {
    if (dialogActive) { closeDialog(); return; }
    if (playerRef.current.isDead) return;
    const obj = findNearbyObject(playerRef.current, levelData.objects);
    if (obj && !obj.collected) { interactObject(obj); return; }
    const npc = findNearbyNPC(playerRef.current, levelData.npcs);
    if (npc) { interactNPC(npc); return; }
    const door = checkDoor(playerRef.current, levelData.doors, collectedRef.current);
    if (door && !door.locked) { notify(`Entrando al Acto ${door.leadsToLevel}...`); setTimeout(() => loadLevel(door.leadsToLevel - 1), 1200); }
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

      if (!dialogActive && !playerRef.current.isDead) {
        const inp = inputRef.current;
        const updated = updatePlayer(
          playerRef.current, inp.left, inp.right, inp.jump,
          levelData.platforms, dt, timeRef.current, canvas.height
        );

        // Check if fell off
        if (updated.y > canvas.height + 100) {
          const respawned = respawnPlayer(updated, levelData.checkpoints);
          if (updated.isDead) {
            setPlayer({ ...respawned, isDead: true, health: 0 });
          } else {
            setPlayer(respawned);
            notify("Has caído... -25 vida");
          }
        } else {
          setPlayer(updated);
        }

        // Update checkpoints
        updateCheckpoints(updated, levelData.checkpoints);

        // Camera follow with bounds
        const targetX = updated.x - canvas.width / 2 + 100;
        const targetY = updated.y - canvas.height / 2 + 50;
        camRef.current.x += (targetX - camRef.current.x) * 0.1;
        camRef.current.y += (targetY - camRef.current.y) * 0.08;
        camRef.current.x = Math.max(0, Math.min(camRef.current.x, levelData.levelWidth - canvas.width));
        camRef.current.y = Math.max(-100, Math.min(camRef.current.y, 200));

        // Door lock check
        for (const door of levelData.doors) {
          door.locked = !door.requiredObjects.every((id: string) => collectedRef.current.has(id));
        }

        // Level 5 completion
        if (levelIdx === 4 && levelData.objects.every((o: InteractiveObject) => o.collected || collectedRef.current.has(o.id))) {
          if (!gameComplete) setGameComplete(true);
        }
      }

      // Render
      const nearObj = findNearbyObject(playerRef.current, levelData.objects);
      const nearNPC = findNearbyNPC(playerRef.current, levelData.npcs);
      render(ctx, levelData, playerRef.current, camRef.current, timeRef.current, nearObj, nearNPC, collectedRef.current);

      // Damage flash overlay
      if (playerRef.current.isInvincible) {
        ctx.fillStyle = "rgba(179, 0, 0, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [dialogActive, levelData, levelIdx, gameComplete]);

  // Completion screen
  if (gameComplete) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Special Elite', serif" }}>
        <div style={{ color: "#FF1A1A", fontSize: 12, letterSpacing: "0.3em", marginBottom: 24 }}>MEMORIA COMPLETA</div>
        <div style={{ color: "#E5DEC9", fontSize: 28, marginBottom: 16 }}>Has recordado todo</div>
        <div style={{ color: "#8C8275", fontSize: 14, marginBottom: 8 }}>15 fragmentos · {deaths} muertes</div>
        <button onClick={() => window.location.href = "/"} style={{ background: "transparent", border: "2px solid #B30000", color: "#E5DEC9", padding: "14px 36px", fontSize: 14, cursor: "pointer", fontFamily: "'Special Elite', serif", marginTop: 24 }}>VOLVER</button>
      </div>
    );
  }

  // Death screen
  if (player.isDead) {
    return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Special Elite', serif", zIndex: 100 }}>
        <div style={{ color: "#FF1A1A", fontSize: 48, textShadow: "0 0 20px #FF1A1A", marginBottom: 16 }}>MEMORIA PERDIDA</div>
        <div style={{ color: "#8C8275", fontSize: 14, marginBottom: 32 }}>Muertes: {deaths + 1}</div>
        <button onClick={restartLevel} style={{ background: "transparent", border: "2px solid #B30000", color: "#E5DEC9", padding: "12px 32px", fontSize: 14, cursor: "pointer", fontFamily: "'Special Elite', serif", letterSpacing: "0.15em" }}>RECORDAR DE NUEVO</button>
      </div>
    );
  }

  const levelCollected = levelData.objects.filter((o: InteractiveObject) => o.collected || collectedRef.current.has(o.id)).length;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* HUD */}
      <div style={{ position: "absolute", top: 16, left: 20, zIndex: 10 }}>
        <div style={{ color: "#B30000", fontSize: 18, letterSpacing: "0.2em", textShadow: "0 0 10px #FF1A1A", fontFamily: "'Special Elite', serif" }}>MONGLI</div>
        <div style={{ color: "#555", fontSize: 11, letterSpacing: "0.1em", marginTop: 4, fontFamily: "monospace" }}>ACTO {levelIdx + 1} · {levelData.name}</div>
        {/* Health bar */}
        <div style={{ width: 120, height: 6, background: "#1a1a1a", borderRadius: 3, marginTop: 6, overflow: "hidden" }}>
          <div style={{ width: `${player.health}%`, height: "100%", background: player.health > 50 ? "#B30000" : player.health > 25 ? "#ff6600" : "#ff0000", boxShadow: `0 0 6px ${player.health > 50 ? "#B30000" : "#ff0000"}`, transition: "width 0.3s" }} />
        </div>
        <div style={{ color: "#333", fontSize: 10, letterSpacing: "0.1em", marginTop: 4, fontFamily: "monospace" }}>{player.health}/100 · MUERTES: {deaths}</div>
      </div>

      {/* Memory counter */}
      <div style={{ position: "absolute", top: 16, right: 20, zIndex: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <span style={{ color: "#555", fontSize: 11, marginRight: 8, fontFamily: "monospace" }}>MEMORIA</span>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: "50%",
            border: `1px solid ${i < levelCollected ? "#FF1A1A" : "#333"}`,
            background: i < levelCollected ? "#FF1A1A" : "transparent",
            boxShadow: i < levelCollected ? "0 0 6px #FF1A1A" : "none",
          }} />
        ))}
      </div>

      {notification && (
        <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "rgba(0,0,0,0.9)", border: "1px solid #333", borderRadius: 4, padding: "8px 20px", color: "#E5DEC9", fontSize: 12, fontFamily: "monospace" }}>{notification}</div>
      )}

      {/* Dialog */}
      {dialogActive && (
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "80%", maxWidth: 600, zIndex: 30, background: "rgba(0,0,0,0.95)", border: "1px solid #B30000", borderRadius: 4, padding: "20px 24px", fontFamily: "'Special Elite', serif", boxShadow: "0 0 30px rgba(179,0,0,0.3)" }}>
          <div style={{ color: "#B30000", fontSize: 11, letterSpacing: "0.2em", marginBottom: 12 }}>{dialogSpeaker} {loading && "..."}</div>
          <p style={{ color: "#E5DEC9", fontSize: 15, lineHeight: 1.8, margin: 0 }}>
            {dialogDisplay}
            {!dialogDone && <span style={{ animation: "blink 1s infinite" }}>|</span>}
          </p>
          {dialogDone && <div style={{ color: "#444", fontSize: 11, marginTop: 12, textAlign: "right", animation: "pulse 1.5s infinite" }}>[E] CONTINUAR</div>}
        </div>
      )}

      {/* Mobile controls */}
      <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 20, display: "flex", gap: 8 }} className="sm:hidden">
        <button onTouchStart={() => inputRef.current.left = true} onTouchEnd={() => inputRef.current.left = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#E5DEC9", fontSize: 20 }}>←</button>
        <button onTouchStart={() => inputRef.current.right = true} onTouchEnd={() => inputRef.current.right = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#E5DEC9", fontSize: 20 }}>→</button>
      </div>
      <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20, display: "flex", gap: 8 }} className="sm:hidden">
        <button onTouchStart={() => inputRef.current.jump = true} onTouchEnd={() => inputRef.current.jump = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#E5DEC9", fontSize: 20 }}>↑</button>
        <button onClick={handleInteract}
          style={{ width: 56, height: 56, background: "rgba(179,0,0,0.2)", border: "1px solid #B30000", borderRadius: 8, color: "#FF1A1A", fontSize: 16 }}>⚡</button>
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}
