"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Player, InputState, InteractiveObject, NPC, Enemy } from "@/lib/game/gameTypes";
import { LEVELS } from "@/lib/game/levels";
import { updatePlayer, findNearbyObject, findNearbyNPC, checkDoor, respawnPlayer, updateCheckpoints, updateEnemy, checkPlayerEnemyCollision } from "@/lib/game/physics";
import { render, resetParticles, spawnFX } from "@/lib/game/renderer";
import { initGameAudio, jumpSound, landSound, footstepSound, damageSound, collectSound, checkpointSound, enemyDetectSound, startGameMusic, stopGameMusic } from "@/lib/game/gameAudio";
import { useChainWrite } from "@/lib/useChainWrite";

function deepCopy<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }

export function GameEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false, interact: false });
  const camRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(0);
  const chainWrite = useChainWrite();
  const lastTimeRef = useRef(0);
  const timeRef = useRef(0);

  const [levelIdx, setLevelIdx] = useState(0);
  const [levelData, setLevelData] = useState(() => deepCopy(LEVELS[0]));
  const [player, setPlayer] = useState<Player>({
    x: 100, y: 320, width: 32, height: 50, velocityX: 0, velocityY: 0,
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
  const [showCompletion, setShowCompletion] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [signTxHash, setSignTxHash] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const introTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [collectedTexts, setCollectedTexts] = useState<string[]>([]);
  const [stompCount, setStompCount] = useState(0);
  const [cutscene, setCutscene] = useState<"none" | "fadeout" | "text" | "fadein">("none");
  const [cutsceneText, setCutsceneText] = useState("");
  const [activePowerUp, setActivePowerUp] = useState<{ type: string; timer: number } | null>(null);
  const [isHiding, setIsHiding] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const shakeRef = useRef({ intensity: 0, duration: 0 });
  const levelStartRef = useRef(Date.now());
  const footstepTimerRef = useRef(0);
  const prevVelYRef = useRef(0);
  const prevEnemyStates = useRef<Record<string, string>>({});
  const twRef = useRef<ReturnType<typeof setInterval>>();

  const triggerShake = (intensity: number, duration: number) => {
    shakeRef.current = { intensity, duration };
  };

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
      setCollectedTexts(prev => [...prev, text]);
      if (twRef.current) clearInterval(twRef.current);
      setDialogDisplay(""); setDialogDone(false);
      let i = 0;
      twRef.current = setInterval(() => { i++; setDialogDisplay(text.slice(0, i)); if (i >= text.length) { clearInterval(twRef.current); setDialogDone(true); } }, 30);
    } catch {
      if (twRef.current) clearInterval(twRef.current);
      setDialogDisplay("La memoria parpadea..."); setDialogDone(true);
      setCollectedTexts(prev => [...prev, "La memoria parpadea..."]);
    } finally { setLoading(false); }
    collectSound(); notify("Fragmento grabado en 0G ✓");
  }, [startDialog, notify, levelIdx]);

  const interactNPC = useCallback((npc: NPC) => {
    startDialog(npc.name, npc.dialogues[npc.currentDialogue] || npc.dialogues[0]);
    npc.currentDialogue = Math.min(npc.currentDialogue + 1, npc.dialogues.length - 1);
  }, [startDialog]);

  const loadLevel = useCallback((idx: number) => {
    if (idx >= LEVELS.length) { setGameComplete(true); stopGameMusic(); return; }
    setLevelIdx(idx);
    resetParticles();
    const newLevel = deepCopy(LEVELS[idx]);
    setLevelData(newLevel);
    setPlayer(p => ({ ...p, x: 100, y: newLevel.groundY - 60, velocityX: 0, velocityY: 0, memoryFragments: 0, health: p.maxHealth, isDead: false, isInvincible: false }));
    camRef.current = { x: 0, y: 0 };
    setShowCompletion(false); setIsSigning(false); setIsSigned(false); setSignTxHash("");
    setCollectedTexts([]); setStompCount(0);
    levelStartRef.current = Date.now();
    setShowIntro(true);
    if (introTimerRef.current) clearTimeout(introTimerRef.current);
    introTimerRef.current = setTimeout(() => setShowIntro(false), 3000);
    startGameMusic(idx + 1);
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
    if (door && !door.locked) { setShowCompletion(true); }
  }, [dialogActive, closeDialog, levelData, interactObject, interactNPC, loadLevel, notify]);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = true;
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = true;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") { inputRef.current.jump = true; jumpSound(); e.preventDefault(); }
      if (e.key === "e" || e.key === "Enter") handleInteract();
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") inputRef.current.left = false;
      if (e.key === "ArrowRight" || e.key === "d") inputRef.current.right = false;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === " ") inputRef.current.jump = false;
    };
    initGameAudio();
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
        // Landing sound
        if (prevVelYRef.current > 150 && updated.isOnGround) landSound();
        prevVelYRef.current = updated.velocityY;

        // Footstep sound
        if (updated.state === "walking" && updated.isOnGround) {
          footstepTimerRef.current -= dt;
          if (footstepTimerRef.current <= 0) { footstepSound(); footstepTimerRef.current = 0.3; }
        }

        // Checkpoint activation sound
        const prevActivated = levelData.checkpoints.filter((c: { activated: boolean }) => c.activated).length;
        updateCheckpoints(updated, levelData.checkpoints);
        const nowActivated = levelData.checkpoints.filter((c: { activated: boolean }) => c.activated).length;
        if (nowActivated > prevActivated) checkpointSound();

        // Update enemies
        for (let i = 0; i < levelData.enemies.length; i++) {
          levelData.enemies[i] = updateEnemy(levelData.enemies[i], updated, levelData.platforms, dt);
          const col = checkPlayerEnemyCollision(updated, levelData.enemies[i]);
          if (col.stomp) {
            levelData.enemies[i] = { ...levelData.enemies[i], state: "stunned", stunnedTimer: 3, velocityX: 0 };
            updated.velocityY = -350;
            spawnFX(levelData.enemies[i].x + 14, levelData.enemies[i].y, "spark", 6);
            notify("Enemigo aturdido"); jumpSound(); setStompCount(s => s + 1);
          } else if (col.hit) {
            updated.health -= levelData.enemies[i].damage;
            updated.isInvincible = true;
            updated.invincibleTimer = 1.5;
            updated.velocityX = updated.x > levelData.enemies[i].x ? 200 : -200;
            updated.velocityY = -200;
            spawnFX(updated.x + 16, updated.y + 25, "blood", 4); damageSound();
            if (updated.health <= 0) { updated.health = 0; updated.isDead = true; }
          }
        }

        // Boss update (level 5)
        if (levelData.boss && updated.x > 3000) {
          const b = levelData.boss;
          if (!b.active) { b.active = true; notify("LA FIGURA DESPIERTA"); }
          if (b.active && b.state !== "dead") {
            if (b.state === "stunned") { b.stunnedTimer -= dt; if (b.stunnedTimer <= 0) b.state = "idle"; }
            else {
              b.attackTimer -= dt;
              const dist = updated.x - b.x;
              b.direction = dist > 0 ? 1 : -1;
              const speed = b.phase === 1 ? 100 : b.phase === 2 ? 160 : 220;
              b.velocityX = b.direction * speed;
              b.x += b.velocityX * dt;
              b.velocityY += 900 * dt; b.y += b.velocityY * dt;
              if (b.y + b.height >= levelData.groundY) { b.y = levelData.groundY - b.height; b.velocityY = 0; }
              // Stomp check
              if (updated.y + updated.height > b.y && updated.y + updated.height < b.y + 30 && updated.velocityY > 80) {
                b.currentHealth -= 20; b.state = "stunned"; b.stunnedTimer = 2;
                updated.velocityY = -500;
                spawnFX(b.x + 30, b.y, "spark", 10);
                triggerShake(10, 0.4);
                b.phase = b.currentHealth <= 33 ? 3 : b.currentHealth <= 66 ? 2 : 1;
                if (b.currentHealth <= 0) { b.state = "dead"; spawnFX(b.x + 30, b.y + 45, "spark", 30); notify("LA FIGURA HA CAÍDO"); triggerShake(15, 0.8); }
              } else if (Math.abs(updated.x - b.x) < b.width && Math.abs(updated.y - b.y) < b.height && !updated.isInvincible && b.state !== "stunned") {
                updated.health -= 30; updated.isInvincible = true; updated.invincibleTimer = 1.5;
                updated.velocityX = updated.x > b.x ? 300 : -300; updated.velocityY = -200;
                damageSound(); triggerShake(10, 0.3);
                if (updated.health <= 0) { updated.health = 0; updated.isDead = true; }
              }
            }
          }
        }

        // Power-up collection
        if (levelData.powerUps) {
          for (const pu of levelData.powerUps) {
            if (pu.collected) continue;
            if (Math.abs(updated.x - pu.x) < 30 && Math.abs(updated.y - pu.y) < 30) {
              pu.collected = true; collectSound();
              setActivePowerUp({ type: pu.type, timer: pu.duration });
              spawnFX(pu.x + 8, pu.y + 8, "collect", 8);
              notify(`Power-up: ${pu.type.toUpperCase()}`);
            }
          }
        }

        // Active power-up countdown
        if (activePowerUp) {
          setActivePowerUp(prev => prev && prev.timer > dt ? { ...prev, timer: prev.timer - dt } : null);
        }

        // Hide spot detection
        if (levelData.hideSpots && Math.abs(updated.velocityX) < 10) {
          const hiding = levelData.hideSpots.some(hs => updated.x > hs.x && updated.x < hs.x + hs.width && updated.y > hs.y && updated.y < hs.y + hs.height);
          setIsHiding(hiding);
          if (hiding) {
            for (const en of levelData.enemies) { if (en.state === "chase") en.state = "patrol"; }
          }
        } else { setIsHiding(false); }

        // Screen shake update
        if (shakeRef.current.duration > 0) shakeRef.current.duration -= dt;

        // Camera follow with bounds
        const targetX = updated.x - canvas.width / 2 + 100;
        const targetY = updated.y - canvas.height / 2 + 50;
        camRef.current.x += (targetX - camRef.current.x) * 0.1;
        camRef.current.y += (targetY - camRef.current.y) * 0.08;
        camRef.current.x = Math.max(0, Math.min(camRef.current.x, levelData.levelWidth - canvas.width));
        camRef.current.y = Math.max(-200, Math.min(camRef.current.y, 300));

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
      // Screen shake
      ctx.save();
      if (shakeRef.current.duration > 0) {
        const s = shakeRef.current.intensity;
        ctx.translate((Math.random() - 0.5) * s * 2, (Math.random() - 0.5) * s * 2);
      }
      render(ctx, levelData, playerRef.current, camRef.current, timeRef.current, nearObj, nearNPC, collectedRef.current);
      ctx.restore();

      // Damage flash overlay
      if (playerRef.current.isInvincible) {
        ctx.fillStyle = "rgba(179, 0, 0, 0.12)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Danger border (enemy chasing nearby)
      let minDist = 9999;
      for (const en of levelData.enemies) {
        if (en.state === "chase") {
          const d = Math.sqrt(Math.pow(en.x - playerRef.current.x, 2) + Math.pow(en.y - playerRef.current.y, 2));
          if (d < minDist) minDist = d;
        }
      }
      if (minDist < 300) {
        const danger = Math.max(0, 1 - minDist / 300);
        ctx.strokeStyle = `rgba(255, 26, 26, ${danger * 0.6})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      }

      // (intro is now HTML overlay, not canvas)

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, [dialogActive, levelData, levelIdx, gameComplete]);

  // Completion screen
  if (gameComplete) {
    return (
      <div className="game-page" style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Special Elite', serif", cursor: "crosshair" }}>
        <div style={{ color: "#FF1A1A", fontSize: 12, letterSpacing: "0.3em", marginBottom: 24 }}>MEMORIA COMPLETA</div>
        <div style={{ color: "#E5DEC9", fontSize: 28, marginBottom: 16 }}>Has recordado todo</div>
        <div style={{ color: "#8C8275", fontSize: 14, marginBottom: 8 }}>15 fragmentos · {deaths} muertes</div>
        <button onClick={() => window.location.href = "/"} style={{ background: "transparent", border: "2px solid #B30000", color: "#E5DEC9", padding: "14px 36px", fontSize: 14, cursor: "crosshair", fontFamily: "'Special Elite', serif", marginTop: 24 }}>VOLVER</button>
      </div>
    );
  }

  // Level completion signing screen
  const levelTime = Math.floor((Date.now() - levelStartRef.current) / 1000);
  const handleSign = async () => {
    setIsSigning(true);
    try {
      const data = JSON.stringify({ levelId: levelIdx + 1, deaths, time: levelTime });
      const encoder = new TextEncoder();
      const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(data));
      const hash = "0x" + Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");
      const tx = await chainWrite.saveFragment(hash, (levelIdx + 1) * 100);
      if (tx) setSignTxHash(tx);
      setIsSigned(true);
    } catch { setIsSigned(true); }
    setIsSigning(false);
  };
  const timeBonus = Math.max(0, 500 - levelTime * 2);
  const deathPenalty = deaths * 100;
  const stompBonus = stompCount * 50;
  const levelScore = 1000 + timeBonus - deathPenalty + stompBonus + 600;

  const handleNextLevel = () => {
    setTotalScore(prev => prev + levelScore);
    const nextDoor = levelData.doors[0];
    if (nextDoor) loadLevel(nextDoor.leadsToLevel - 1);
    else setGameComplete(true);
  };

  if (showCompletion) {
    const fmt = `${Math.floor(levelTime / 60)}:${String(levelTime % 60).padStart(2, "0")}`;
    return (
      <div className="game-page" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Special Elite', serif", zIndex: 100, cursor: "crosshair", overflowY: "auto", padding: "20px" }}>
        <div style={{ color: "#B30000", fontSize: 11, letterSpacing: "0.3em", marginBottom: 8 }}>NIVEL {levelIdx + 1} COMPLETADO</div>
        <div style={{ color: "#E5DEC9", fontSize: 28, marginBottom: 4 }}>{levelData.name}</div>
        <div style={{ color: "#555", fontSize: 13, marginBottom: 28 }}>{fmt} · {deaths} muertes · {stompCount} aturdidos</div>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: 20, marginBottom: 24, maxWidth: 400, width: "90%" }}>
          <div style={{ color: "#444", fontSize: 10, letterSpacing: "0.2em", marginBottom: 12 }}>FRAGMENTOS RECUPERADOS</div>
          {collectedTexts.map((t, i) => (
            <div key={i} style={{ color: "#8C8275", fontSize: 12, lineHeight: 1.5, marginBottom: 8, paddingLeft: 12, borderLeft: "2px solid #B30000" }}>{t.slice(0, 80)}...</div>
          ))}
        </div>
        {/* Score */}
        <div className="uxpm-surface" style={{ borderRadius: 8, padding: 16, marginBottom: 20, maxWidth: 300, width: "90%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, fontFamily: "monospace" }}>
            <span style={{ color: "#555" }}>BASE</span><span style={{ color: "#E5DEC9", textAlign: "right" }}>1000</span>
            <span style={{ color: "#555" }}>TIEMPO</span><span style={{ color: "#4CAF50", textAlign: "right" }}>+{timeBonus}</span>
            <span style={{ color: "#555" }}>MUERTES</span><span style={{ color: "#FF4444", textAlign: "right" }}>-{deathPenalty}</span>
            <span style={{ color: "#555" }}>STOMPS</span><span style={{ color: "#FF6600", textAlign: "right" }}>+{stompBonus}</span>
            <span style={{ color: "#555" }}>FRAGMENTOS</span><span style={{ color: "#c4923a", textAlign: "right" }}>+600</span>
          </div>
          <div style={{ borderTop: "1px solid #2a2a2a", marginTop: 10, paddingTop: 10, textAlign: "center", color: "#E5DEC9", fontSize: 20, letterSpacing: "0.1em" }}>TOTAL: {levelScore}</div>
        </div>
        {!isSigning && !isSigned && chainWrite.isConnected && chainWrite.hasContract && (
          <button onClick={handleSign} style={{ background: "transparent", border: "2px solid #B30000", color: "#E5DEC9", padding: "14px 36px", fontSize: 14, cursor: "crosshair", fontFamily: "'Special Elite', serif", letterSpacing: "0.2em", boxShadow: "0 0 20px rgba(179,0,0,0.3)", marginBottom: 12 }}>⛓ GRABAR EN 0G CHAIN</button>
        )}
        {isSigning && <div style={{ color: "#B30000", fontSize: 13, letterSpacing: "0.15em", animation: "pulse 1s infinite" }}>FIRMANDO EN METAMASK...</div>}
        {isSigned && signTxHash && <div style={{ color: "#4CAF50", fontSize: 13, marginBottom: 16 }}>✓ GRABADO EN 0G · {signTxHash.slice(0, 10)}...</div>}
        <button onClick={handleNextLevel} style={{ background: isSigned || !chainWrite.isConnected ? "#B30000" : "none", border: isSigned || !chainWrite.isConnected ? "none" : "none", color: isSigned || !chainWrite.isConnected ? "#E5DEC9" : "#333", padding: "14px 36px", fontSize: 14, cursor: "crosshair", fontFamily: "'Special Elite', serif", letterSpacing: "0.2em", marginTop: isSigned ? 0 : 16 }}>
          {isSigned || !chainWrite.isConnected ? "SIGUIENTE ACTO →" : "continuar sin firmar →"}
        </button>
      </div>
    );
  }

  // Death screen
  if (player.isDead) {
    return (
      <div className="game-page" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Special Elite', serif", zIndex: 100, cursor: "crosshair" }}>
        <div style={{ color: "#FF1A1A", fontSize: 48, textShadow: "0 0 20px #FF1A1A", marginBottom: 16 }}>MEMORIA PERDIDA</div>
        <div style={{ color: "#8C8275", fontSize: 14, marginBottom: 32 }}>Muertes: {deaths + 1}</div>
        <button onClick={restartLevel} style={{ background: "transparent", border: "2px solid #B30000", color: "#E5DEC9", padding: "12px 32px", fontSize: 14, cursor: "crosshair", fontFamily: "'Special Elite', serif", letterSpacing: "0.15em" }}>RECORDAR DE NUEVO</button>
      </div>
    );
  }

  const levelCollected = levelData.objects.filter((o: InteractiveObject) => o.collected || collectedRef.current.has(o.id)).length;

  return (
    <div className="game-page" style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000", cursor: "crosshair" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* Intro overlay */}
      {showIntro && (
        <div onClick={() => setShowIntro(false)} style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.88)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          zIndex: 50, cursor: "crosshair", fontFamily: "'Special Elite', serif",
        }}>
          <div style={{ color: "#555", fontSize: 11, letterSpacing: "0.4em", marginBottom: 12 }}>ACTO {levelIdx + 1}</div>
          <div style={{ color: "#E5DEC9", fontSize: 32, letterSpacing: "0.1em", marginBottom: 8, textShadow: "0 0 20px rgba(179,0,0,0.5)" }}>{levelData.name}</div>
          <div style={{ color: "#444", fontSize: 13, marginBottom: 32 }}>Encuentra los fragmentos de tu memoria</div>
          <div style={{ color: "#333", fontSize: 11, letterSpacing: "0.2em", animation: "pulse 1.5s infinite" }}>CLICK PARA COMENZAR</div>
        </div>
      )}

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

      {/* Boss HP bar */}
      {levelData.boss?.active && levelData.boss.state !== "dead" && (
        <div className="uxpm-glass" style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", width: 300, padding: "12px 16px", textAlign: "center", cursor: "crosshair", zIndex: 20 }}>
          <div style={{ color: "#FF1A1A", fontSize: 11, letterSpacing: "0.2em", marginBottom: 6 }}>LA FIGURA</div>
          <div style={{ background: "#111", height: 6, borderRadius: 3 }}>
            <div style={{ width: `${(levelData.boss.currentHealth / levelData.boss.maxHealth) * 100}%`, height: "100%", background: "linear-gradient(90deg, #7a0000, #FF1A1A)", boxShadow: "0 0 8px #FF1A1A", borderRadius: 3, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Power-up indicator */}
      {activePowerUp && (
        <div style={{ position: "absolute", top: 100, left: 20, zIndex: 10, background: "rgba(0,0,0,0.7)", border: "1px solid #2a2a2a", borderRadius: 4, padding: "4px 10px", fontSize: 10, color: "#E5DEC9", fontFamily: "monospace" }}>
          {activePowerUp.type.toUpperCase()} {Math.ceil(activePowerUp.timer)}s
        </div>
      )}

      {/* Hidden indicator */}
      {isHiding && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10, color: "#4444ff", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em" }}>
          OCULTO
        </div>
      )}

      {/* Mini map */}
      <div style={{ position: "absolute", top: 56, right: 20, zIndex: 10 }}>
        <div style={{ width: 150, height: 30, background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4, position: "relative", overflow: "hidden" }}>
          {/* Player dot */}
          <div style={{ position: "absolute", left: `${(player.x / levelData.levelWidth) * 100}%`, top: "50%", transform: "translateY(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#FF1A1A", boxShadow: "0 0 4px #FF1A1A" }} />
          {/* Object dots */}
          {levelData.objects.filter((o: InteractiveObject) => !o.collected && !collectedRef.current.has(o.id)).map((o: InteractiveObject) => (
            <div key={o.id} style={{ position: "absolute", left: `${(o.x / levelData.levelWidth) * 100}%`, top: "50%", transform: "translateY(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#E5DEC9" }} />
          ))}
          {/* Enemy dots */}
          {levelData.enemies.filter((en: Enemy) => en.state !== "dead").map((en: Enemy) => (
            <div key={en.id} style={{ position: "absolute", left: `${(en.x / levelData.levelWidth) * 100}%`, top: "50%", transform: "translateY(-50%)", width: 3, height: 3, borderRadius: "50%", background: en.state === "chase" ? "#ff4444" : "#ff8800" }} />
          ))}
        </div>
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
