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
    collectSound(); notify("Fragmento recuperado");
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

  const [guestBlocked, setGuestBlocked] = useState(false);

  // Completion screen
  if (gameComplete) {
    return (
      <div className="game-page gx-overlay" style={{ position: "fixed", background: "var(--bg)" }}>
        <div className="gx-eyebrow">Memoria completa</div>
        <div className="gx-title">Has recordado todo</div>
        <div className="gx-sub font-mono">15 fragmentos · {deaths} muertes</div>
        <button onClick={() => window.location.href = "/"} className="btn btn-primary mt-8">Volver al inicio</button>
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

  const isGuest = typeof window !== "undefined" && sessionStorage.getItem("mongli-guest-mode") === "true";

  const handleNextLevel = () => {
    setTotalScore(prev => prev + levelScore);
    const nextDoor = levelData.doors[0];
    if (!nextDoor) { setGameComplete(true); return; }
    const nextLevelIdx = nextDoor.leadsToLevel - 1;
    // Guest mode: block after level 2
    if (isGuest && nextLevelIdx >= 2) { setGuestBlocked(true); return; }
    loadLevel(nextLevelIdx);
  };

  // Guest mode blocked overlay
  if (guestBlocked) {
    return (
      <div className="game-page gx-overlay">
        <span className="stamp mb-6">Acceso restringido</span>
        <div className="gx-title">Los actos 3, 4 y 5 requieren wallet</div>
        <p className="gx-sub">Conecta tu wallet en la página de inicio para seguir la historia y registrar cada acto en 0G Galileo testnet.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button onClick={() => window.location.href = "/"} className="btn btn-primary">Conectar wallet</button>
          <button onClick={() => window.location.href = "/"} className="btn btn-secondary">Volver al inicio</button>
        </div>
      </div>
    );
  }

  if (showCompletion) {
    const fmt = `${Math.floor(levelTime / 60)}:${String(levelTime % 60).padStart(2, "0")}`;
    const rows: [string, string, string][] = [
      ["Base", "1000", "var(--text)"],
      ["Tiempo", `+${timeBonus}`, "var(--ok)"],
      ["Muertes", `-${deathPenalty}`, "var(--accent)"],
      ["Aturdidos", `+${stompBonus}`, "var(--text)"],
      ["Fragmentos", "+600", "var(--text)"],
    ];
    return (
      <div className="game-page completion-overlay gx-overlay" onMouseMove={() => {}}>
        <div className="gx-eyebrow">Acto {levelIdx + 1} completado</div>
        <div className="gx-title">{levelData.name}</div>
        <div className="gx-sub font-mono">{fmt} · {deaths} muertes · {stompCount} aturdidos</div>
        <div className="panel mt-8 w-full max-w-[420px] p-5 text-left">
          <div className="eyebrow mb-3">Fragmentos recuperados</div>
          {collectedTexts.map((t, i) => (
            <p key={i} className="mb-2 border-l-2 border-noir-accent pl-3 text-[14px] leading-relaxed text-noir-muted">{t.slice(0, 80)}…</p>
          ))}
        </div>
        <div className="panel mt-3 w-full max-w-[420px] p-5 font-mono text-[13px]">
          <dl className="grid grid-cols-2 gap-y-1.5">
            {rows.map(([k, v, c]) => (
              <div key={k} className="contents">
                <dt className="text-left text-noir-muted">{k}</dt>
                <dd className="text-right" style={{ color: c }}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-baseline justify-between border-t border-noir-border pt-3">
            <span className="text-noir-muted">Total</span>
            <span className="font-display text-[24px] font-bold text-noir-text">{levelScore}</span>
          </div>
        </div>
        <div className="mt-6 flex w-full max-w-[420px] flex-col items-stretch gap-3">
          {!isSigning && !isSigned && chainWrite.isConnected && chainWrite.hasContract && (
            <button onClick={handleSign} className="btn btn-secondary">Registrar acto en 0G testnet</button>
          )}
          {isSigning && <p className="text-[14px] text-noir-muted" style={{ animation: "pulse 1.2s infinite" }}>Esperando firma en tu wallet…</p>}
          {isSigned && signTxHash && <p className="font-mono text-[13px] text-noir-ok">Registrado en 0G · {signTxHash.slice(0, 10)}…</p>}
          <button onClick={handleNextLevel} className={isSigned || !chainWrite.isConnected ? "btn btn-primary" : "btn btn-ghost"}>
            {isSigned || !chainWrite.isConnected ? "Siguiente acto →" : "Continuar sin registrar →"}
          </button>
        </div>
      </div>
    );
  }

  // Death screen
  if (player.isDead) {
    return (
      <div className="game-page gx-overlay">
        <div className="gx-eyebrow">Muertes: {deaths + 1}</div>
        <div className="gx-title">Memoria perdida</div>
        <p className="gx-sub">El recuerdo se escapó. Vuelve a intentarlo desde el inicio del acto.</p>
        <button onClick={restartLevel} className="btn btn-primary mt-8">Recordar de nuevo</button>
      </div>
    );
  }

  const levelCollected = levelData.objects.filter((o: InteractiveObject) => o.collected || collectedRef.current.has(o.id)).length;

  return (
    <div className="game-page" style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000", cursor: "crosshair" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {/* Intro overlay */}
      {showIntro && (
        <div onClick={() => setShowIntro(false)} className="gx-overlay" style={{ zIndex: 50, cursor: "pointer", background: "rgba(11,11,12,0.9)" }}>
          <div className="gx-eyebrow">Acto {levelIdx + 1}</div>
          <div className="gx-title">{levelData.name}</div>
          <p className="gx-sub">Encuentra los fragmentos de tu memoria.</p>
          <span className="btn btn-secondary mt-8">Toca o haz clic para comenzar</span>
        </div>
      )}

      {/* HUD */}
      <div className="gx-hud-panel" style={{ position: "absolute", top: "max(12px, env(safe-area-inset-top))", left: 12, zIndex: 10 }}>
        <div className="font-display font-extrabold text-[16px] tracking-[0.04em] text-noir-text">MONGLI</div>
        <div className="gx-hud mt-1">Acto {levelIdx + 1} · {levelData.name}</div>
        <div style={{ width: 128, height: 6, background: "var(--raised)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
          <div style={{ width: `${player.health}%`, height: "100%", background: player.health > 25 ? "var(--accent-fill)" : "var(--accent)", transition: "width 0.3s" }} />
        </div>
        <div className="gx-hud mt-1">{player.health}/100 · muertes {deaths}</div>
      </div>

      {/* Memory counter */}
      <div className="gx-hud-panel" style={{ position: "absolute", top: "max(12px, env(safe-area-inset-top))", right: 12, zIndex: 10, display: "flex", gap: 6, alignItems: "center" }}>
        <span className="gx-hud mr-2">Memoria</span>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            border: `1px solid ${i < levelCollected ? "var(--accent)" : "var(--line-strong)"}`,
            background: i < levelCollected ? "var(--accent)" : "transparent",
          }} />
        ))}
      </div>

      {/* Boss HP bar */}
      {levelData.boss?.active && levelData.boss.state !== "dead" && (
        <div className="uxpm-glass" style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", width: 300, padding: "12px 16px", textAlign: "center", cursor: "crosshair", zIndex: 20 }}>
          <div className="gx-eyebrow" style={{ marginBottom: 6 }}>La figura</div>
          <div style={{ background: "#111", height: 6, borderRadius: 3 }}>
            <div style={{ width: `${(levelData.boss.currentHealth / levelData.boss.maxHealth) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      {/* Power-up indicator */}
      {activePowerUp && (
        <div style={{ position: "absolute", top: 100, left: 20, zIndex: 10, background: "rgba(0,0,0,0.7)", border: "1px solid #2a2a2a", borderRadius: 4, padding: "4px 10px", fontSize: 10, color: "#ECE8E1", fontFamily: "monospace" }}>
          {activePowerUp.type.toUpperCase()} {Math.ceil(activePowerUp.timer)}s
        </div>
      )}

      {/* Hidden indicator */}
      {isHiding && (
        <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 10, color: "var(--muted)", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.15em" }}>
          OCULTO
        </div>
      )}

      {/* Mini map */}
      <div style={{ position: "absolute", top: 56, right: 20, zIndex: 10 }}>
        <div style={{ width: 150, height: 30, background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 4, position: "relative", overflow: "hidden" }}>
          {/* Player dot */}
          <div style={{ position: "absolute", left: `${(player.x / levelData.levelWidth) * 100}%`, top: "50%", transform: "translateY(-50%)", width: 4, height: 4, borderRadius: "50%", background: "var(--accent)" }} />
          {/* Object dots */}
          {levelData.objects.filter((o: InteractiveObject) => !o.collected && !collectedRef.current.has(o.id)).map((o: InteractiveObject) => (
            <div key={o.id} style={{ position: "absolute", left: `${(o.x / levelData.levelWidth) * 100}%`, top: "50%", transform: "translateY(-50%)", width: 3, height: 3, borderRadius: "50%", background: "#ECE8E1" }} />
          ))}
          {/* Enemy dots */}
          {levelData.enemies.filter((en: Enemy) => en.state !== "dead").map((en: Enemy) => (
            <div key={en.id} style={{ position: "absolute", left: `${(en.x / levelData.levelWidth) * 100}%`, top: "50%", transform: "translateY(-50%)", width: 3, height: 3, borderRadius: "50%", background: en.state === "chase" ? "#ff4444" : "#ff8800" }} />
          ))}
        </div>
      </div>

      {notification && (
        <div style={{ position: "absolute", top: 60, left: "50%", transform: "translateX(-50%)", zIndex: 20, background: "rgba(0,0,0,0.9)", border: "1px solid #333", borderRadius: 4, padding: "8px 20px", color: "#ECE8E1", fontSize: 12, fontFamily: "monospace" }}>{notification}</div>
      )}

      {/* Dialog */}
      {dialogActive && (
        <div style={{ position: "absolute", bottom: 80, left: "50%", transform: "translateX(-50%)", width: "80%", maxWidth: 600, zIndex: 30, background: "rgba(0,0,0,0.95)", border: "1px solid var(--line-strong)", borderLeft: "2px solid var(--accent)", borderRadius: 4, padding: "20px 24px", fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <div className="gx-eyebrow" style={{ marginBottom: 10 }}>{dialogSpeaker} {loading && "..."}</div>
          <p style={{ color: "var(--text)", fontSize: 16, lineHeight: 1.7, margin: 0 }}>
            {dialogDisplay}
            {!dialogDone && <span style={{ animation: "blink 1s infinite" }}>|</span>}
          </p>
          {dialogDone && <div className="gx-hud" style={{ marginTop: 12, textAlign: "right" }}>[E] Continuar</div>}
        </div>
      )}

      {/* Mobile controls */}
      <div style={{ position: "absolute", bottom: 16, left: 16, zIndex: 20, display: "flex", gap: 8 }} className="sm:hidden">
        <button onTouchStart={() => inputRef.current.left = true} onTouchEnd={() => inputRef.current.left = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#ECE8E1", fontSize: 20 }}>←</button>
        <button onTouchStart={() => inputRef.current.right = true} onTouchEnd={() => inputRef.current.right = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#ECE8E1", fontSize: 20 }}>→</button>
      </div>
      <div style={{ position: "absolute", bottom: 16, right: 16, zIndex: 20, display: "flex", gap: 8 }} className="sm:hidden">
        <button onTouchStart={() => inputRef.current.jump = true} onTouchEnd={() => inputRef.current.jump = false}
          style={{ width: 56, height: 56, background: "rgba(255,255,255,0.08)", border: "1px solid #333", borderRadius: 8, color: "#ECE8E1", fontSize: 20 }}>↑</button>
        <button onClick={handleInteract}
          style={{ width: 56, height: 56, background: "rgba(179,38,30,0.25)", border: "1px solid var(--accent)", borderRadius: 6, color: "var(--accent)", fontSize: 14, fontWeight: 600 }} aria-label="Interactuar">E</button>
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:1 } }
      `}</style>
    </div>
  );
}
