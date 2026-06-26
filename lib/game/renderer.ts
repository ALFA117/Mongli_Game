import type { Player, Platform, InteractiveObject, NPC, Door, Level, BackgroundLayer, ParticleConfig } from "./gameTypes";
import { INTERACT_RANGE } from "./gameTypes";

interface Camera { x: number; y: number }
interface FX { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; type: string }

let ambientParticles: FX[] = [];
let fxParticles: FX[] = [];
let ambientInit = false;
let playerTrail: { x: number; y: number }[] = [];

function initAmbient(config: ParticleConfig, w: number) {
  ambientParticles = Array.from({ length: config.count }, () => ({
    x: Math.random() * w * 2, y: Math.random() * 600, vx: config.type === "paper" ? (Math.random() - 0.5) * 0.8 : 0,
    vy: config.type === "rain" ? 4 + Math.random() * 6 : 0.3 + Math.random() * 0.5,
    life: 1, maxLife: 1, size: config.type === "rain" ? 1 : 2 + Math.random() * 2, color: config.color, type: config.type,
  }));
  ambientInit = true;
}

export function spawnFX(x: number, y: number, type: string, count = 5) {
  for (let i = 0; i < count; i++) {
    fxParticles.push({
      x, y, vx: (Math.random() - 0.5) * (type === "spark" ? 200 : 80),
      vy: -Math.random() * (type === "impact" ? 150 : 100),
      life: 0.4 + Math.random() * 0.3, maxLife: 0.5,
      size: type === "collect" ? 3 : 2 + Math.random() * 2,
      color: type === "collect" ? "#FF1A1A" : type === "blood" ? "#8b0000" : type === "spark" ? "#ffaa00" : "#8C8275",
      type,
    });
  }
}

export function resetParticles() { ambientInit = false; fxParticles = []; playerTrail = []; }

export function render(
  ctx: CanvasRenderingContext2D, level: Level, player: Player, cam: Camera, time: number,
  nearObj: InteractiveObject | null, nearNPC: NPC | null, collectedIds: Set<string>
) {
  const W = ctx.canvas.width, H = ctx.canvas.height;

  // Background
  // Level-specific background gradient
  const bgColors: Record<number, [string, string]> = {
    1: ["#0a0514", "#14082a"], 2: ["#050a14", "#0a1428"],
    3: ["#050a05", "#0a140a"], 4: ["#000000", "#050005"], 5: ["#14050a", "#1a0810"],
  };
  const [bgTop, bgBot] = bgColors[level.id] || ["#050505", "#0a0a0a"];
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, bgTop); bgGrad.addColorStop(1, bgBot);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Parallax
  for (const layer of level.bgLayers) drawBgLayer(ctx, layer, cam);

  // Ambient particles
  if (!ambientInit) initAmbient(level.ambientParticles, W);
  drawAmbientParticles(ctx, level.ambientParticles, cam, H);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Platforms
  for (const p of level.platforms) drawPlatform(ctx, p, time, level.id);

  // Doors
  for (const d of level.doors) drawDoor(ctx, d, d.requiredObjects.every(id => collectedIds.has(id)), time);

  // Objects
  for (const o of level.objects) if (!o.collected) drawObject(ctx, o, player, time);

  // NPCs
  for (const n of level.npcs) drawNPC(ctx, n, time);

  // Player lighting (glow underneath)
  const px = player.x + player.width / 2, py = player.y + player.height / 2;
  const grd = ctx.createRadialGradient(px, py, 0, px, py, 90);
  grd.addColorStop(0, "rgba(229,222,201,0.06)");
  grd.addColorStop(1, "transparent");
  ctx.fillStyle = grd;
  ctx.fillRect(px - 90, py - 90, 180, 180);

  // Player shadow on ground
  const groundY = level.groundY;
  const airDist = Math.max(0, groundY - (player.y + player.height));
  const shadowScale = Math.max(0.2, 1 - airDist / 200);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(player.x + player.width / 2, groundY, 16 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player trail
  if (Math.abs(player.velocityX) > 100) {
    playerTrail.push({ x: player.x, y: player.y });
    if (playerTrail.length > 6) playerTrail.shift();
  } else {
    if (playerTrail.length > 0) playerTrail.shift();
  }
  for (let i = 0; i < playerTrail.length; i++) {
    ctx.globalAlpha = 0.04 + i * 0.015;
    drawPlayerSilhouette(ctx, playerTrail[i].x, playerTrail[i].y, player, time, true);
  }
  ctx.globalAlpha = 1;

  // Draw player (with invincibility blink)
  if (!player.isInvincible || Math.sin(time * 20) > 0) {
    drawPlayerDetailed(ctx, player, time);
  }

  // Enemies (passed via level.enemies which is mutated in game loop)
  if (level.enemies) {
    for (const en of level.enemies) {
      if (en.state === "dead") continue;
      ctx.globalAlpha = en.state === "stunned" ? 0.4 : 0.9;
      ctx.fillStyle = en.type === "crawler" ? "#1a0a0a" : "#0d0d0d";
      if (en.type === "crawler") {
        ctx.fillRect(en.x, en.y + 10, en.width, en.height - 10);
        ctx.fillStyle = "#fff"; ctx.fillRect(en.x + 6, en.y + 14, 3, 3); ctx.fillRect(en.x + 18, en.y + 14, 3, 3);
      } else {
        ctx.fillRect(en.x + 6, en.y + 14, 16, 22);
        ctx.beginPath(); ctx.arc(en.x + 14, en.y + 10, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(en.x + 10, en.y + 8, 2, 2); ctx.fillRect(en.x + 16, en.y + 8, 2, 2);
      }
      if (en.state === "stunned") {
        ctx.fillStyle = "#ffaa00"; ctx.font = "12px serif"; ctx.textAlign = "center";
        ctx.fillText("★", en.x + 14, en.y - 5);
      }
      if (en.state === "chase") {
        ctx.fillStyle = "#FF1A1A"; ctx.font = "10px monospace"; ctx.textAlign = "center";
        ctx.fillText("!", en.x + 14, en.y - 5);
      }
      ctx.globalAlpha = 1;
    }
  }

  // Interact hints
  if (nearObj && !nearObj.collected) drawHint(ctx, nearObj.x + nearObj.width / 2, nearObj.y - 20, `[E] ${nearObj.label}`);
  if (nearNPC) drawHint(ctx, nearNPC.x + 16, nearNPC.y - 20, "[E] Hablar");

  // FX particles
  updateAndDrawFX(ctx, 1 / 60);

  ctx.restore();

  // Darkness vignette (flashlight effect)
  const lightRadius: Record<number, number> = { 1: 80, 2: 60, 3: 70, 4: 40, 5: 50 };
  const innerR = lightRadius[level.id] || 70;
  const screenPx = player.x - cam.x + player.width / 2;
  const screenPy = player.y - cam.y + player.height / 2;
  const dark = ctx.createRadialGradient(screenPx, screenPy, innerR, screenPx, screenPy, 350);
  dark.addColorStop(0, "rgba(0,0,0,0)");
  dark.addColorStop(0.4, "rgba(0,0,0,0.3)");
  dark.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, W, H);

  // Damage flash
  if (player.isInvincible) {
    ctx.fillStyle = "rgba(179,0,0,0.15)";
    ctx.fillRect(0, 0, W, H);
  }
}

function drawPlayerDetailed(ctx: CanvasRenderingContext2D, p: Player, time: number) {
  const x = p.x, y = p.y;
  ctx.save();
  if (!p.facingRight) { ctx.translate(x + p.width, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }

  // Breathing
  const breathe = p.state === "idle" ? Math.sin(time * 3) * 1 : 0;

  // HAT (fedora)
  ctx.fillStyle = "#111";
  ctx.fillRect(x + 2, y - 2 + breathe, 28, 8); // brim
  ctx.fillRect(x + 6, y - 12 + breathe, 20, 12); // crown
  ctx.fillStyle = "#B30000";
  ctx.fillRect(x + 6, y - 3 + breathe, 20, 2); // band

  // HEAD
  ctx.fillStyle = "#E5DEC9";
  ctx.beginPath();
  ctx.arc(x + 16, y + 10 + breathe, 12, 0, Math.PI * 2);
  ctx.fill();
  // Face shadow
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.arc(x + 16, y + 14 + breathe, 10, 0, Math.PI);
  ctx.fill();

  // EYES
  const blinking = p.blinkTimer < 0.15;
  if (!blinking) {
    ctx.fillStyle = "#FF1A1A";
    ctx.shadowColor = "#FF1A1A"; ctx.shadowBlur = 8;
    ctx.fillRect(x + 11, y + 8 + breathe, 3, 3);
    ctx.fillRect(x + 18, y + 8 + breathe, 3, 3);
    ctx.shadowBlur = 0;
    // Eye glow
    const eg = ctx.createRadialGradient(x + 12, y + 9 + breathe, 0, x + 12, y + 9 + breathe, 20);
    eg.addColorStop(0, "rgba(255,26,26,0.1)"); eg.addColorStop(1, "transparent");
    ctx.fillStyle = eg; ctx.fillRect(x - 5, y - 5, 40, 30);
  }

  // NECK
  ctx.fillStyle = "#C8BCA8";
  ctx.fillRect(x + 13, y + 20 + breathe, 6, 6);

  // TORSO
  ctx.fillStyle = "#D4C9B4";
  ctx.fillRect(x + 4, y + 24 + breathe, 24, 22);
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.fillRect(x + 4, y + 24 + breathe, 8, 22); // shadow
  // Buttons
  ctx.fillStyle = "#8C8275";
  for (let i = 0; i < 3; i++) ctx.fillRect(x + 15, y + 28 + i * 6 + breathe, 2, 2);

  // ARMS
  const armSwing = p.state === "walking" ? Math.sin(time * 8) * 12 : 0;
  ctx.fillStyle = "#C8BCA8";
  ctx.save(); ctx.translate(x + 3, y + 26 + breathe); ctx.rotate((-armSwing * Math.PI) / 180); ctx.fillRect(-3, 0, 7, 18); ctx.restore();
  if (p.state === "interacting") {
    ctx.save(); ctx.translate(x + 24, y + 26 + breathe); ctx.rotate(-0.7); ctx.fillRect(0, 0, 7, 18); ctx.restore();
  } else {
    ctx.save(); ctx.translate(x + 24, y + 26 + breathe); ctx.rotate((armSwing * Math.PI) / 180); ctx.fillRect(0, 0, 7, 18); ctx.restore();
  }

  // LEGS
  ctx.fillStyle = "#C8BCA8";
  const legSwing = p.state === "walking" ? Math.sin(time * 8) * 10 : 0;
  if (p.state === "jumping") {
    ctx.fillRect(x + 6, y + 44, 9, 10); ctx.fillRect(x + 17, y + 44, 9, 10);
  } else {
    ctx.save(); ctx.translate(x + 8, y + 44); ctx.rotate((legSwing * Math.PI) / 180); ctx.fillRect(-3, 0, 9, 16); ctx.restore();
    ctx.save(); ctx.translate(x + 20, y + 44); ctx.rotate((-legSwing * Math.PI) / 180); ctx.fillRect(-3, 0, 9, 16); ctx.restore();
  }
  // Boots
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x + 4, y + 56, 11, 5);
  ctx.fillRect(x + 17, y + 56, 11, 5);

  // Walking dust
  if (p.state === "walking" && p.isOnGround && Math.floor(time * 8) % 2 === 0) {
    spawnFX(x + 16, y + p.height, "dust", 1);
  }

  ctx.restore();
}

function drawPlayerSilhouette(ctx: CanvasRenderingContext2D, x: number, y: number, p: Player, _t: number, ghost: boolean) {
  ctx.fillStyle = ghost ? "#0d0d0d" : "#E5DEC9";
  ctx.beginPath(); ctx.arc(x + 16, y + 10, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(x + 4, y + 24, 24, 22);
  ctx.fillRect(x + 6, y + 44, 9, 14); ctx.fillRect(x + 17, y + 44, 9, 14);
}

function drawBgLayer(ctx: CanvasRenderingContext2D, layer: BackgroundLayer, cam: Camera) {
  for (const el of layer.elements) {
    const sx = el.x - cam.x * layer.speed;
    ctx.fillStyle = "#080808";
    ctx.fillRect(sx, el.y, el.w, el.h);
    if (el.lit) {
      for (let wy = el.y + 20; wy < el.y + el.h - 20; wy += 40) {
        for (let wx = sx + 8; wx < sx + el.w - 8; wx += 18) {
          ctx.fillStyle = "rgba(196,146,58,0.12)";
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
  }
}

function drawAmbientParticles(ctx: CanvasRenderingContext2D, config: ParticleConfig, cam: Camera, H: number) {
  for (const p of ambientParticles) {
    p.y += p.vy; p.x += p.vx;
    if (p.y > H) { p.y = -5; p.x = Math.random() * ctx.canvas.width * 2; }
    ctx.fillStyle = config.color;
    ctx.globalAlpha = 0.3;
    if (config.type === "rain") ctx.fillRect(p.x - cam.x * 0.5, p.y, 1, 8);
    else { ctx.beginPath(); ctx.arc(p.x - cam.x * 0.2, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}

function updateAndDrawFX(ctx: CanvasRenderingContext2D, dt: number) {
  for (let i = fxParticles.length - 1; i >= 0; i--) {
    const p = fxParticles[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 300 * dt; p.life -= dt;
    if (p.life <= 0) { fxParticles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, time: number, levelId: number) {
  if (plat.type === "flickering") {
    const vis = Math.sin(time * 2 + plat.x * 0.01) > -0.3;
    if (!vis) { ctx.globalAlpha = 0.05; ctx.fillStyle = "#300000"; ctx.fillRect(plat.x, plat.y, plat.width, plat.height); ctx.globalAlpha = 1; return; }
    ctx.globalAlpha = 0.6 + Math.sin(time * 3) * 0.2;
    ctx.fillStyle = "rgba(100,0,0,0.5)";
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.strokeStyle = "#FF1A1A"; ctx.lineWidth = 1;
    ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    ctx.globalAlpha = 1;
    return;
  }
  const isGround = plat.height >= 40;
  if (isGround) {
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height + 100);
    ctx.fillStyle = "#3a3a6e";
    ctx.fillRect(plat.x, plat.y, plat.width, 3);
  } else {
    const platColors: Record<number, [string, string]> = {
      1: ["#3d2810", "#5a3a18"], 2: ["#1a2030", "#2a3448"],
      3: ["#1a1a10", "#2a2a20"], 4: ["#2d0000", "#5a1a1a"], 5: ["#1a0030", "#3a1a5a"],
    };
    const [base, top] = platColors[levelId] || ["#2d1a1a", "#5a3a3a"];
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(plat.x + 3, plat.y + plat.height, plat.width - 3, 4);
    ctx.fillStyle = base;
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.fillStyle = top;
    ctx.fillRect(plat.x, plat.y, plat.width, 2);
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, door: Door, unlocked: boolean, time: number) {
  if (unlocked) {
    ctx.fillStyle = "#051a05";
    ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.strokeStyle = "#00B300"; ctx.lineWidth = 2;
    ctx.shadowBlur = 10 + Math.sin(time * 3) * 8; ctx.shadowColor = "#00FF00";
    ctx.strokeRect(door.x, door.y, door.width, door.height);
    ctx.fillStyle = "#00FF00"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("SALIDA →", door.x + door.width / 2, door.y - 10);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#1a0505";
    ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.strokeStyle = "#5a0000"; ctx.lineWidth = 2;
    ctx.strokeRect(door.x, door.y, door.width, door.height);
    // Padlock
    ctx.fillStyle = "#B30000"; ctx.shadowBlur = 8; ctx.shadowColor = "#FF1A1A";
    ctx.beginPath(); ctx.arc(door.x + door.width / 2, door.y + door.height / 2 - 5, 7, Math.PI, 0); ctx.stroke();
    ctx.fillRect(door.x + door.width / 2 - 6, door.y + door.height / 2 - 2, 12, 10);
    ctx.fillStyle = "#FF1A1A"; ctx.font = "8px monospace"; ctx.textAlign = "center";
    ctx.fillText("BLOQUEADA", door.x + door.width / 2, door.y - 6);
    ctx.shadowBlur = 0;
  }
}

function drawObject(ctx: CanvasRenderingContext2D, obj: InteractiveObject, player: Player, time: number) {
  const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
  const dy = (player.y + player.height / 2) - (obj.y + obj.height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const near = dist < INTERACT_RANGE;
  const visible = dist < 300;

  if (near) { ctx.shadowBlur = 20 + Math.sin(time * 4) * 6; ctx.shadowColor = "#FF1A1A"; }
  else if (visible) { ctx.shadowBlur = 6; ctx.shadowColor = "#FF1A1A"; }

  if (obj.type === "light") {
    ctx.fillStyle = "#FF1A1A";
    ctx.globalAlpha = near ? 1 : 0.6;
    ctx.beginPath(); ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2 + (near ? 3 : 0), 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = near ? "#8a3030" : visible ? "#4a2020" : "#2a1515";
    ctx.globalAlpha = near ? 1 : visible ? 0.7 : 0.35;
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    ctx.strokeStyle = near ? "#FF1A1A" : "#5a3030";
    ctx.lineWidth = near ? 2 : 1;
    ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
  }

  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawNPC(ctx: CanvasRenderingContext2D, npc: NPC, time: number) {
  ctx.fillStyle = npc.type === "reflection" ? "#3060a0" : npc.type === "hooded" ? "#1a0a0a" : "#E5DEC9";
  ctx.globalAlpha = npc.type === "figure" ? 0.5 : 0.85;
  // Outline for visibility
  ctx.strokeStyle = npc.type === "reflection" ? "#6090d0" : "#3a1a1a";
  ctx.lineWidth = 1;
  ctx.fillRect(npc.x + 8, npc.y + 16, 16, 28);
  ctx.strokeRect(npc.x + 8, npc.y + 16, 16, 28);
  ctx.beginPath(); ctx.arc(npc.x + 16, npc.y + 10, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (npc.type === "hooded") { ctx.fillStyle = "#0a0a0a"; ctx.beginPath(); ctx.arc(npc.x + 16, npc.y + 8, 12, Math.PI, Math.PI * 2); ctx.fill(); }
  // Single white eye for NPCs (different from player's red eyes)
  ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.9;
  ctx.fillRect(npc.x + 14, npc.y + 9, 4, 3);
  ctx.globalAlpha = 1;
}

function drawHint(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.fillStyle = "#B30000"; ctx.font = "11px monospace"; ctx.textAlign = "center";
  ctx.shadowBlur = 6; ctx.shadowColor = "#FF1A1A"; ctx.fillText(text, x, y); ctx.shadowBlur = 0;
}
