import type { Player, Platform, InteractiveObject, NPC, Door, Level, Enemy } from "./gameTypes";
import { INTERACT_RANGE } from "./gameTypes";

interface Cam { x: number; y: number }
interface FX { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string; type: string }

let ambientParts: { x: number; y: number; vy: number; vx: number; size: number }[] = [];
let fxParts: FX[] = [];
let ambientReady = false;

export function spawnFX(x: number, y: number, type: string, count = 5) {
  for (let i = 0; i < count; i++) {
    fxParts.push({ x, y, vx: (Math.random() - 0.5) * (type === "spark" ? 200 : 80), vy: -Math.random() * 120, life: 0.4 + Math.random() * 0.3, maxLife: 0.5, size: 2 + Math.random() * 2, color: type === "collect" ? "#FF1A1A" : type === "blood" ? "#8b0000" : type === "spark" ? "#ffaa00" : "#8C8275", type });
  }
}
export function resetParticles() { ambientReady = false; fxParts = []; }

// ═══════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════
export function render(
  ctx: CanvasRenderingContext2D, level: Level, player: Player, cam: Cam, time: number,
  nearObj: InteractiveObject | null, nearNPC: NPC | null, collectedIds: Set<string>
) {
  const W = ctx.canvas.width, H = ctx.canvas.height;

  // 1. Background
  drawBackground(ctx, level.id, cam, time, W, H);

  // 2. Ambient particles
  if (!ambientReady) { initAmbient(level, W); ambientReady = true; }
  drawAmbient(ctx, level, cam, H);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // 3. Ground
  drawGround(ctx, level, cam, W);

  // 4. Hide spots
  if (level.hideSpots) for (const hs of level.hideSpots) {
    ctx.fillStyle = "rgba(0,0,40,0.12)"; ctx.fillRect(hs.x, hs.y, hs.width, hs.height);
  }

  // 5. Doors
  for (const d of level.doors) drawDoor(ctx, d, d.requiredObjects.every(id => collectedIds.has(id)), time);

  // 6. Objects
  for (const o of level.objects) if (!o.collected && !collectedIds.has(o.id)) drawObject(ctx, o, player, time);

  // 7. NPCs
  for (const n of level.npcs) drawNPC(ctx, n, time, player);

  // 8. Power-ups
  if (level.powerUps) for (const pu of level.powerUps) { if (!pu.collected) drawPowerUp(ctx, pu, time); }

  // 9. Platforms
  for (const p of level.platforms) drawPlatform(ctx, p, time, level.id);

  // 10. Enemies
  for (const en of level.enemies) drawEnemy(ctx, en, time, player);

  // 11. Boss
  if (level.boss?.active && level.boss.state !== "dead") drawBoss(ctx, level.boss, time);

  // 12. Player
  drawPlayer(ctx, player, time, level.groundY);

  // 13. Interact hints
  if (nearObj && !nearObj.collected) drawPrompt(ctx, nearObj.x + nearObj.width / 2, nearObj.y - 30, nearObj.label);
  if (nearNPC) drawPrompt(ctx, nearNPC.x + 16, nearNPC.y - 25, "Hablar");

  // 14. FX particles
  for (let i = fxParts.length - 1; i >= 0; i--) {
    const p = fxParts[i]; p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 5; p.life -= 1 / 60;
    if (p.life <= 0) { fxParts.splice(i, 1); continue; }
    ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // 15. Darkness vignette
  const cx = player.x - cam.x + 16, cy = player.y - cam.y + 24;
  const innerR = [80, 60, 70, 40, 50][Math.min(level.id - 1, 4)];
  const dark = ctx.createRadialGradient(cx, cy, innerR, cx, cy, 380);
  dark.addColorStop(0, "rgba(0,0,0,0)"); dark.addColorStop(0.4, "rgba(0,0,0,0.2)"); dark.addColorStop(1, "rgba(0,0,0,0.88)");
  ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);

  // Damage flash
  if (player.isInvincible) { ctx.fillStyle = "rgba(179,0,0,0.12)"; ctx.fillRect(0, 0, W, H); }
}

// ═══════════════════════════════════════
// BACKGROUND
// ═══════════════════════════════════════
function drawBackground(ctx: CanvasRenderingContext2D, levelId: number, cam: Cam, time: number, W: number, H: number) {
  const bgs: Record<number, [string, string, string]> = {
    1: ["#02010a", "#08041a", "#0d0520"], 2: ["#010508", "#050c14", "#080f1a"],
    3: ["#050a05", "#0a140a", "#0d1a0d"], 4: ["#000000", "#020005", "#050008"], 5: ["#0a0005", "#14050a", "#1a0810"],
  };
  const [c1, c2, c3] = bgs[levelId] || bgs[1];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, c1); g.addColorStop(0.6, c2); g.addColorStop(1, c3);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  if (levelId === 1) {
    // Moon
    const mx = 150 - cam.x * 0.02, my = 80;
    const halo = ctx.createRadialGradient(mx, my, 18, mx, my, 80);
    halo.addColorStop(0, "rgba(240,232,192,0.08)"); halo.addColorStop(1, "transparent");
    ctx.fillStyle = halo; ctx.fillRect(mx - 80, my - 80, 160, 160);
    ctx.fillStyle = "#f0e8c0"; ctx.beginPath(); ctx.arc(mx, my, 22, 0, Math.PI * 2); ctx.fill();

    // Stars
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + 50) % 800) - cam.x * 0.01;
      const sy = ((i * 89 + 30) % 200) + 20;
      ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(time * (0.5 + i * 0.1) + i) * 0.25})`;
      ctx.beginPath(); ctx.arc(sx % W, sy, i % 3 === 0 ? 1.5 : 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // Candelabros
    for (const lx of [250, 500, 700]) {
      const sx = lx - cam.x; if (sx < -80 || sx > W + 80) continue;
      ctx.strokeStyle = "#2a2030"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, 160); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#3a2820"; ctx.strokeStyle = "#3a2820"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, 170, 20, 0, Math.PI * 2); ctx.stroke();
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const bx = sx + Math.cos(ang) * 20, by = 170 + Math.sin(ang) * 6;
        ctx.beginPath(); ctx.moveTo(sx, 170); ctx.lineTo(bx, by); ctx.stroke();
        ctx.fillStyle = "#d4c890"; ctx.fillRect(bx - 1.5, by - 10, 3, 10);
        const fl = Math.sin(time * 8 + a * 1.3) * 2;
        ctx.fillStyle = `rgba(255,${160 + fl * 10},50,0.8)`;
        ctx.beginPath(); ctx.ellipse(bx, by - 12 + fl * 0.5, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
        const cl = ctx.createRadialGradient(bx, by - 12, 0, bx, by - 12, 35);
        cl.addColorStop(0, "rgba(255,180,60,0.1)"); cl.addColorStop(1, "transparent");
        ctx.fillStyle = cl; ctx.fillRect(bx - 35, by - 47, 70, 70);
      }
    }
  }

  if (levelId === 2) {
    // Storm clouds
    ctx.fillStyle = "#080e18";
    for (let c = 0; c < 4; c++) {
      const cx2 = ((c * 300 + time * (15 + c * 5)) % (W + 200)) - 100, cy2 = 30 + c * 20;
      for (const [ox, oy, r] of [[0, 0, 40], [35, -10, 35], [70, 5, 38], [-25, 5, 30]] as const) {
        ctx.beginPath(); ctx.arc(cx2 + ox, cy2 + oy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (Math.sin(time * 0.3) > 0.98) { ctx.fillStyle = "rgba(200,220,255,0.04)"; ctx.fillRect(0, 0, W, H); }

    // Gas lamps
    for (let i = 0; i < 12; i++) {
      const lx = i * 400 + 200 - cam.x * 0.2; if (lx < -80 || lx > W + 80) continue;
      ctx.fillStyle = "#1a1828"; ctx.fillRect(lx - 2, H - 180, 4, 80);
      const flk = 0.12 + Math.sin(time * 3 + i * 1.5) * 0.04;
      const lg = ctx.createRadialGradient(lx, H - 175, 3, lx, H - 175, 70);
      lg.addColorStop(0, `rgba(255,140,40,${flk})`); lg.addColorStop(1, "transparent");
      ctx.fillStyle = lg; ctx.fillRect(lx - 70, H - 245, 140, 140);
    }

    // Neon sign
    const nx = 500 - cam.x * 0.3;
    const nOn = Math.sin(time * 7) > -0.3;
    ctx.fillStyle = nOn ? "#ff2020" : "#1a0505"; ctx.font = "18px monospace";
    if (nOn) { ctx.shadowBlur = 15; ctx.shadowColor = "#ff2020"; }
    ctx.fillText("HOTEL", nx, 250); ctx.shadowBlur = 0;

    // Graffiti
    ctx.save(); ctx.globalAlpha = 0.1; ctx.fillStyle = "#B30000"; ctx.font = "24px 'Special Elite',serif";
    ctx.fillText("RECUERDA", 300 - cam.x * 0.15, 260); ctx.fillText("QUIÉN ERES", 800 - cam.x * 0.15, 300); ctx.restore();
  }

  // Parallax buildings (all levels)
  for (let layer = 0; layer < 2; layer++) {
    const speed = layer === 0 ? 0.05 : 0.15;
    const color = layer === 0 ? (levelId === 2 ? "#050810" : "#0a0820") : (levelId === 2 ? "#0a0e1a" : "#0f0c1e");
    ctx.fillStyle = color;
    for (let i = 0; i < 20; i++) {
      const bx = (i * 200 - cam.x * speed) % (W + 200) - 100;
      const bh = (layer === 0 ? 80 : 120) + (i * 67) % (layer === 0 ? 150 : 100);
      ctx.fillRect(bx, H - bh - (layer === 0 ? 100 : 80), 80 + (i * 23) % 60, bh);
      if (layer === 1) {
        for (let wy = H - bh - 60; wy < H - 90; wy += 15) {
          for (let wx = bx + 8; wx < bx + 70; wx += 12) {
            if ((i * 7 + wy * 3 + wx) % 5 !== 0) {
              ctx.fillStyle = `rgba(40,35,15,${0.4 + Math.sin(time * 0.3 + i * wx) * 0.1})`;
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
        ctx.fillStyle = color;
      }
    }
  }
}

// ═══════════════════════════════════════
// GROUND
// ═══════════════════════════════════════
function drawGround(ctx: CanvasRenderingContext2D, level: Level, cam: Cam, W: number) {
  const G = level.groundY;
  if (level.id === 1) {
    ctx.fillStyle = "#1c1830"; ctx.fillRect(0, G, level.levelWidth, 200);
    ctx.strokeStyle = "rgba(255,255,255,0.025)"; ctx.lineWidth = 2;
    for (let v = 0; v < 20; v++) {
      const sx = v * 300; ctx.beginPath(); ctx.moveTo(sx, G);
      ctx.bezierCurveTo(sx + 80, G - 12, sx + 200, G - 4, sx + 300, G - 10); ctx.stroke();
    }
    ctx.fillStyle = "#2a2545"; ctx.fillRect(0, G, level.levelWidth, 2);
  } else if (level.id === 2) {
    ctx.fillStyle = "#0c0e14"; ctx.fillRect(0, G, level.levelWidth, 200);
    ctx.strokeStyle = "rgba(80,70,0,0.25)"; ctx.lineWidth = 2.5; ctx.setLineDash([40, 20]);
    ctx.beginPath(); ctx.moveTo(0, G + 10); ctx.lineTo(level.levelWidth, G + 10); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1;
    for (const cp of [300, 700, 1200, 1800, 2500, 3200, 3900, 4500]) {
      ctx.beginPath(); ctx.moveTo(cp, G); ctx.lineTo(cp + 15, G + 15); ctx.lineTo(cp + 8, G + 30); ctx.stroke();
    }
    // Puddles
    for (const px of [400, 1000, 1800, 2600, 3400, 4200]) {
      ctx.fillStyle = "#0a1525"; ctx.beginPath(); ctx.ellipse(px, G + 2, 45, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(100,120,180,0.1)"; ctx.beginPath(); ctx.ellipse(px, G + 2, 25, 3, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    const gc: Record<number, string> = { 3: "#0d0d08", 4: "#050005", 5: "#0d0508" };
    ctx.fillStyle = gc[level.id] || "#111"; ctx.fillRect(0, G, level.levelWidth, 200);
    ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fillRect(0, G, level.levelWidth, 2);
  }
}

// ═══════════════════════════════════════
// PLATFORMS
// ═══════════════════════════════════════
function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, time: number, levelId: number) {
  if (plat.broken) return;
  if (plat.type === "flickering") {
    const vis = Math.sin(time * 2 + plat.x * 0.01) > -0.3;
    if (!vis) { ctx.globalAlpha = 0.05; ctx.fillStyle = "#300000"; ctx.fillRect(plat.x, plat.y, plat.width, plat.height); ctx.globalAlpha = 1; return; }
    ctx.globalAlpha = 0.5 + Math.sin(time * 3) * 0.2;
    ctx.fillStyle = "rgba(100,0,0,0.4)"; ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.strokeStyle = "#FF1A1A"; ctx.lineWidth = 1; ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    ctx.globalAlpha = 1; return;
  }
  const isGround = plat.height >= 40;
  if (isGround) return; // Ground drawn separately

  let fill: string, top: string;
  if (plat.hasSpikes) { fill = "#1a0505"; top = "#2a0808"; }
  else if (plat.breakable) { fill = plat.breakTimer !== undefined && plat.breakTimer < 0.5 ? "#3a1a0a" : "#2d1a0e"; top = "#4a2a14"; }
  else if (plat.moving) { fill = "#1a2d1a"; top = "#2a4a2a"; }
  else {
    const c: Record<number, [string, string]> = { 1: ["#2d1f0e", "#4a3018"], 2: ["#151a24", "#1e2535"], 3: ["#1a1a10", "#2a2a18"], 4: ["#2d0000", "#5a1a1a"], 5: ["#200030", "#300050"] };
    [fill, top] = c[levelId] || ["#2d1a1a", "#5a3a3a"];
  }

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(plat.x + 3, plat.y + plat.height, plat.width - 6, 4);
  // Body
  ctx.fillStyle = fill; ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  // Top edge
  ctx.fillStyle = top; ctx.fillRect(plat.x, plat.y, plat.width, 3);

  // Textures
  if (levelId === 1 && !plat.moving && !plat.breakable && !plat.hasSpikes) {
    ctx.strokeStyle = "rgba(0,0,0,0.15)"; ctx.lineWidth = 0.5;
    for (let w = 0; w < plat.width; w += 8) { ctx.beginPath(); ctx.moveTo(plat.x + w, plat.y + 3); ctx.lineTo(plat.x + w + 4, plat.y + plat.height - 1); ctx.stroke(); }
  }
  if (levelId === 2 && !plat.moving) {
    ctx.strokeStyle = "rgba(255,255,255,0.04)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(plat.x, plat.y + 5); ctx.lineTo(plat.x + plat.width, plat.y + 5); ctx.stroke();
    ctx.fillStyle = "#1e2535";
    ctx.beginPath(); ctx.arc(plat.x + 4, plat.y + 4, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(plat.x + plat.width - 4, plat.y + 4, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Moving indicator
  if (plat.moving && plat.startX !== undefined && plat.endX !== undefined) {
    ctx.strokeStyle = "rgba(40,120,40,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(plat.startX, plat.y + plat.height / 2); ctx.lineTo(plat.endX + plat.width, plat.y + plat.height / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(40,180,40,0.5)"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
    ctx.fillText(plat.direction === 1 ? "→" : "←", plat.x + plat.width / 2, plat.y - 8); ctx.textAlign = "left";
  }

  // Breakable cracks
  if (plat.breakable && plat.breakTimer !== undefined) {
    const amt = 1 - plat.breakTimer / 1.2;
    ctx.strokeStyle = `rgba(200,80,0,${amt * 0.7})`; ctx.lineWidth = 0.8;
    for (let c = 0; c < Math.floor(amt * 4); c++) { ctx.beginPath(); ctx.moveTo(plat.x + 15 + c * 20, plat.y + 2); ctx.lineTo(plat.x + 10 + c * 20, plat.y + plat.height - 2); ctx.stroke(); }
    if (plat.breakTimer < 0.4 && Math.sin(time * 25) > 0) { ctx.fillStyle = "rgba(200,50,0,0.15)"; ctx.fillRect(plat.x, plat.y, plat.width, plat.height); }
  }

  // Spikes
  if (plat.hasSpikes) {
    for (let s = 0; s < Math.floor(plat.width / 10); s++) {
      const sx = plat.x + s * 10 + 5;
      ctx.fillStyle = "#5a0808"; ctx.beginPath(); ctx.moveTo(sx - 4, plat.y); ctx.lineTo(sx, plat.y - 12); ctx.lineTo(sx + 4, plat.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#FF1A1A"; ctx.shadowColor = "#FF1A1A"; ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(sx, plat.y - 12, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    }
  }
}

// ═══════════════════════════════════════
// PLAYER
// ═══════════════════════════════════════
function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, time: number, groundY: number) {
  // Light aura
  const pcx = p.x + 16, pcy = p.y + 24;
  const aura = ctx.createRadialGradient(pcx, pcy, 0, pcx, pcy, 100);
  aura.addColorStop(0, "rgba(229,222,201,0.06)"); aura.addColorStop(1, "transparent");
  ctx.fillStyle = aura; ctx.fillRect(pcx - 100, pcy - 100, 200, 200);

  // Ground shadow
  const airDist = Math.max(0, groundY - p.y - p.height);
  const ss = Math.max(0.1, 1 - airDist / 200);
  ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(p.x + 16, groundY, 18 * ss, 4 * ss, 0, 0, Math.PI * 2); ctx.fill();

  if (p.isInvincible && Math.sin(time * 20) > 0) ctx.globalAlpha = 0.4;

  ctx.save();
  const bx = p.x;
  if (!p.facingRight) { ctx.translate(p.x + p.width, 0); ctx.scale(-1, 1); }
  const px = p.facingRight ? bx : 0;
  const py = p.y;
  const walk = Math.sin(time * 8);

  // Legs
  ctx.fillStyle = "#C8BCA8";
  if (p.state === "walking") {
    ctx.save(); ctx.translate(px + 11, py + 44); ctx.rotate(walk * 0.3); ctx.fillRect(-4, 0, 8, 18); ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-5, 14, 10, 6); ctx.restore();
    ctx.fillStyle = "#C8BCA8"; ctx.save(); ctx.translate(px + 21, py + 44); ctx.rotate(-walk * 0.3); ctx.fillRect(-4, 0, 8, 18); ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-5, 14, 10, 6); ctx.restore();
  } else {
    ctx.fillRect(px + 7, py + 44, 8, 18); ctx.fillRect(px + 17, py + 44, 8, 18);
    ctx.fillStyle = "#1a1a1a"; ctx.fillRect(px + 6, py + 58, 10, 6); ctx.fillRect(px + 16, py + 58, 10, 6);
  }

  // Torso
  ctx.fillStyle = "#D4C9B4"; ctx.fillRect(px + 4, py + 20, 24, 26);
  ctx.fillStyle = "#B8AD98"; ctx.fillRect(px + 4, py + 20, 6, 26);
  ctx.fillStyle = "#8C8275"; for (let b = 0; b < 3; b++) { ctx.beginPath(); ctx.arc(px + 18, py + 28 + b * 7, 1.5, 0, Math.PI * 2); ctx.fill(); }

  // Arms
  ctx.fillStyle = "#C8BCA8";
  if (p.state === "interacting") { ctx.save(); ctx.translate(px + 28, py + 24); ctx.rotate(-0.6); ctx.fillRect(0, -3, 16, 7); ctx.restore(); }
  else { ctx.save(); ctx.translate(px + 2, py + 22); ctx.rotate(walk * 0.2); ctx.fillRect(-3, 0, 7, 16); ctx.restore(); ctx.save(); ctx.translate(px + 26, py + 22); ctx.rotate(-walk * 0.2); ctx.fillRect(-4, 0, 7, 16); ctx.restore(); }

  // Neck + Head
  ctx.fillStyle = "#C8BCA8"; ctx.fillRect(px + 12, py + 15, 8, 7);
  ctx.fillStyle = "#E5DEC9"; ctx.beginPath(); ctx.arc(px + 16, py + 10, 12, 0, Math.PI * 2); ctx.fill();

  // Eyes — expressions based on situation
  const isFalling = p.velocityY > 200 && !p.isOnGround;
  const isHurt = p.health < 30;
  if (p.isDead) {
    // Dead: X eyes
    ctx.strokeStyle = "#666"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px + 9, py + 6); ctx.lineTo(px + 13, py + 10); ctx.moveTo(px + 13, py + 6); ctx.lineTo(px + 9, py + 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + 19, py + 6); ctx.lineTo(px + 23, py + 10); ctx.moveTo(px + 23, py + 6); ctx.lineTo(px + 19, py + 10); ctx.stroke();
    // Sad mouth
    ctx.strokeStyle = "#888"; ctx.lineWidth = 1; ctx.beginPath();
    ctx.arc(px + 16, py + 18, 4, 0.2, Math.PI - 0.2); ctx.stroke();
  } else if (p.blinkTimer > 0.15) {
    const eyeR = isFalling ? 3.5 : isHurt ? 1.8 : 2.5;
    const eyeSpread = isFalling ? 2 : 0;
    ctx.fillStyle = "#FF1A1A"; ctx.shadowColor = "#FF1A1A"; ctx.shadowBlur = isFalling ? 12 : 8;
    ctx.beginPath(); ctx.arc(px + 11 - eyeSpread, py + 8, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px + 21 + eyeSpread, py + 8, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Eyebrows when falling (scared)
    if (isFalling) {
      ctx.strokeStyle = "#C8BCA8"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px + 8, py + 4); ctx.lineTo(px + 12, py + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 24, py + 4); ctx.lineTo(px + 20, py + 5); ctx.stroke();
    }
    // Squint when hurt
    if (isHurt) {
      ctx.fillStyle = "rgba(10,10,10,0.6)"; ctx.fillRect(px + 9, py + 7, 5, 2);
    }
  }

  // Fedora — tilts when falling
  const hatTilt = isFalling ? 0.3 : p.state === "jumping" ? 0.15 : 0;
  ctx.save(); ctx.translate(px + 16, py - 3); ctx.rotate(hatTilt);
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.ellipse(0, 0, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-10, -17, 20, 18);
  ctx.fillStyle = "#B30000"; ctx.fillRect(-10, -3, 20, 3);
  ctx.restore();

  // Scarf — flies up when falling
  const scarfY = isFalling ? -8 : 0;
  ctx.strokeStyle = "#6a6060"; ctx.lineWidth = 3.5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(px + 10, py + 17 + scarfY);
  ctx.quadraticCurveTo(px + 16 + Math.sin(time * 2) * (isFalling ? 8 : 3), py + 22 + scarfY * 1.5, px + 22, py + 19 + scarfY); ctx.stroke();
  // Second scarf tail when running
  if (Math.abs(p.velocityX) > 100) {
    ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(px + 8, py + 18 + scarfY);
    ctx.quadraticCurveTo(px + 2 + Math.sin(time * 3) * 5, py + 25 + scarfY, px - 2, py + 22 + scarfY); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.lineCap = "butt";

  // Speed trail when running fast
  if (Math.abs(p.velocityX) > 160) {
    const dir = p.velocityX > 0 ? -1 : 1;
    for (let t = 1; t <= 5; t++) {
      ctx.globalAlpha = 0.03 * (6 - t); ctx.fillStyle = "#E5DEC9";
      ctx.beginPath(); ctx.arc(px + 16 + dir * t * 10, py + 10, 10 - t, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(px + 4 + dir * t * 10, py + 20, 24, 20);
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

// ═══════════════════════════════════════
// ENEMIES
// ═══════════════════════════════════════
function drawEnemy(ctx: CanvasRenderingContext2D, en: Enemy, time: number, player: Player) {
  if (en.state === "dead") return;
  const ex = en.x, ey = en.y;
  const chasing = en.state === "chase";
  const stunned = en.state === "stunned";

  if (en.type === "shadow") {
    if (chasing) { const a = ctx.createRadialGradient(ex + 14, ey + 20, 0, ex + 14, ey + 20, 50); a.addColorStop(0, "rgba(0,0,30,0.35)"); a.addColorStop(1, "transparent"); ctx.fillStyle = a; ctx.fillRect(ex - 36, ey - 30, 100, 100); }
    ctx.fillStyle = stunned ? "#1a1a3a" : "#05050f";
    ctx.beginPath(); ctx.arc(ex + 14, ey + 10, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(ex + 4, ey + 18, 20, 26);
    const la = Math.sin(time * (chasing ? 12 : 6)) * 6;
    ctx.fillRect(ex + 4, ey + 42, 8, 14 + la); ctx.fillRect(ex + 16, ey + 42, 8, 14 - la);
    // WHITE OUTLINE
    ctx.strokeStyle = stunned ? "#aaf" : "#fff"; ctx.lineWidth = chasing ? 2 : 1.5;
    ctx.beginPath(); ctx.arc(ex + 14, ey + 10, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(ex + 4, ey + 18, 20, 26);
    // White eyes
    ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = chasing ? 8 : 4;
    ctx.beginPath(); ctx.arc(ex + 10, ey + 9, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex + 18, ey + 9, 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    if (chasing) { ctx.fillStyle = "#FF4444"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.fillText("!", ex + 14, ey - 8); ctx.textAlign = "left"; }
    if (stunned) { for (let s = 0; s < 3; s++) { const sa = time * 4 + s * 2.09; ctx.fillStyle = "#ff0"; ctx.font = "10px serif"; ctx.fillText("★", ex + 14 + Math.cos(sa) * 14, ey - 8 + Math.sin(sa) * 5); } }
  }

  if (en.type === "watcher") {
    ctx.fillStyle = "#1a0d00"; ctx.beginPath(); ctx.arc(ex + 14, ey + 20, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#FF6600"; ctx.lineWidth = 2; ctx.shadowColor = "#FF6600"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(ex + 14, ey + 20, 20, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    const ea = Math.atan2(player.y - en.y, player.x - en.x);
    const px2 = ex + 14 + Math.cos(ea) * 8, py2 = ey + 20 + Math.sin(ea) * 8;
    ctx.fillStyle = "#FF6600"; ctx.shadowColor = "#FF6600"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(px2, py2, 7, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(px2, py2, 3, 0, Math.PI * 2); ctx.fill();
    // Cone
    ctx.save(); ctx.translate(ex + 14, ey + 20); ctx.rotate(ea);
    const cg = ctx.createLinearGradient(0, 0, en.detectionRange, 0);
    cg.addColorStop(0, "rgba(255,102,0,0.2)"); cg.addColorStop(1, "transparent");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, en.detectionRange, -0.7, 0.7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,102,0,0.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(en.detectionRange * Math.cos(0.7), en.detectionRange * Math.sin(0.7));
    ctx.moveTo(0, 0); ctx.lineTo(en.detectionRange * Math.cos(-0.7), en.detectionRange * Math.sin(-0.7)); ctx.stroke();
    ctx.restore();
    if (chasing) { ctx.strokeStyle = "#FF4400"; ctx.lineWidth = 3; ctx.shadowColor = "#FF4400"; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(ex + 14, ey + 20, 25, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
  }

  if (en.type === "crawler") {
    const cy = ey + en.height - 12;
    ctx.fillStyle = "#0d001a"; ctx.beginPath(); ctx.ellipse(ex + 20, cy, 22, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8800FF"; ctx.lineWidth = 2; ctx.shadowColor = "#8800FF"; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.ellipse(ex + 20, cy, 22, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    for (const ox of [-10, -4, 4, 10]) { ctx.fillStyle = "#AA44FF"; ctx.shadowColor = "#8800FF"; ctx.shadowBlur = 4; ctx.beginPath(); ctx.arc(ex + 20 + ox, cy - 3, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.strokeStyle = "#6600CC"; ctx.lineWidth = 1;
    for (let l = 0; l < 6; l++) { ctx.beginPath(); ctx.moveTo(ex + 5 + l * 7, cy); ctx.lineTo(ex + 1 + l * 7, cy + 8 + Math.sin(time * 10 + l * 0.8) * 5); ctx.stroke(); }
  }
}

// ═══════════════════════════════════════
// BOSS
// ═══════════════════════════════════════
function drawBoss(ctx: CanvasRenderingContext2D, b: { x: number; y: number; width: number; height: number; phase: number; state: string; currentHealth: number; maxHealth: number }, time: number) {
  ctx.fillStyle = "#050505"; ctx.strokeStyle = "#FF1A1A"; ctx.lineWidth = 2;
  ctx.shadowColor = "#FF1A1A"; ctx.shadowBlur = b.phase >= 3 ? 15 : 6;
  ctx.fillRect(b.x, b.y, b.width, b.height); ctx.strokeRect(b.x, b.y, b.width, b.height);
  ctx.fillStyle = "#FF1A1A";
  ctx.beginPath(); ctx.ellipse(b.x + 18, b.y + 25, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(b.x + 42, b.y + 25, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
  if (b.phase >= 2) { ctx.strokeStyle = "#FF1A1A"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x + 20, b.y + 40); ctx.lineTo(b.x + 35, b.y + 70); ctx.stroke(); }
  if (b.phase >= 3 && Math.sin(time * 10) > 0) { ctx.globalAlpha = 0.4; ctx.fillStyle = "#FF1A1A"; ctx.fillRect(b.x, b.y, b.width, b.height); ctx.globalAlpha = 1; }
  ctx.shadowBlur = 0;
  if (b.state === "stunned") { ctx.fillStyle = "#ff0"; ctx.font = "16px serif"; ctx.textAlign = "center"; ctx.fillText("★", b.x + b.width / 2, b.y - 10); ctx.textAlign = "left"; }
}

// ═══════════════════════════════════════
// OBJECTS, DOORS, NPCs, POWER-UPS
// ═══════════════════════════════════════
function drawObject(ctx: CanvasRenderingContext2D, obj: InteractiveObject, player: Player, time: number) {
  const dist = Math.sqrt(Math.pow(player.x + 16 - obj.x - obj.width / 2, 2) + Math.pow(player.y + 25 - obj.y - obj.height / 2, 2));
  const near = dist < INTERACT_RANGE;

  if (near) { ctx.shadowBlur = 20; ctx.shadowColor = "#FF1A1A"; }
  else if (dist < 250) { ctx.shadowBlur = 4; ctx.shadowColor = "#FF1A1A"; }

  ctx.fillStyle = obj.type === "light" ? "#FF1A1A" : near ? "#8a3030" : "#3a2020";
  ctx.globalAlpha = near ? 1 : dist < 250 ? 0.65 : 0.35;

  if (obj.type === "light") {
    // Glowing orb with multiple halos
    const cx = obj.x + obj.width / 2, cy = obj.y + obj.height / 2;
    const pulse = 0.9 + Math.sin(time * 3) * 0.1;
    const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35 * pulse);
    g2.addColorStop(0, "rgba(255,200,100,0.5)"); g2.addColorStop(0.5, "rgba(255,150,50,0.2)"); g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2; ctx.fillRect(cx - 35, cy - 35, 70, 70);
    ctx.fillStyle = "#ffe0a0"; ctx.beginPath(); ctx.arc(cx, cy, 8 * pulse, 0, Math.PI * 2); ctx.fill();
    // Orbiting sparkles
    for (let s = 0; s < 6; s++) {
      const sa = time * 2 + s * 1.05; ctx.fillStyle = "rgba(255,200,100,0.6)";
      ctx.beginPath(); ctx.arc(cx + Math.cos(sa) * 16, cy + Math.sin(sa) * 10, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  } else if (obj.type === "item") {
    // Suitcase
    ctx.fillStyle = near ? "#5a3820" : "#3a2810";
    ctx.fillRect(obj.x, obj.y + 4, obj.width, obj.height - 4);
    ctx.fillStyle = near ? "#7a5030" : "#5a4020"; ctx.fillRect(obj.x + obj.width / 2 - 6, obj.y, 12, 5); // handle
    ctx.fillStyle = "#2a1a08"; ctx.fillRect(obj.x + 4, obj.y + 8, 3, 3); ctx.fillRect(obj.x + obj.width - 7, obj.y + 8, 3, 3); // clasps
  } else if (obj.type === "mirror") {
    // Mirror with frame
    ctx.fillStyle = "#3a2810"; ctx.fillRect(obj.x - 3, obj.y - 3, obj.width + 6, obj.height + 6); // frame
    const mg = ctx.createLinearGradient(obj.x, obj.y, obj.x + obj.width, obj.y + obj.height);
    mg.addColorStop(0, "#8090a0"); mg.addColorStop(1, "#506070"); ctx.fillStyle = mg;
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(obj.x + 5, obj.y + 5); ctx.lineTo(obj.x + obj.width - 10, obj.y + obj.height - 10); ctx.stroke();
  } else if (obj.type === "phone") {
    ctx.fillStyle = near ? "#2a4a2a" : "#1a2a1a";
    ctx.fillRect(obj.x, obj.y + 8, obj.width, obj.height - 8); // base
    ctx.fillStyle = near ? "#3a5a3a" : "#2a3a2a";
    ctx.beginPath(); ctx.arc(obj.x + 6, obj.y + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(obj.x + obj.width - 6, obj.y + 6, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(obj.x + 5, obj.y + 3, obj.width - 10, 6); // handset
    if (near) { // ringing indicator
      ctx.strokeStyle = "rgba(196,146,58,0.4)"; ctx.lineWidth = 1;
      for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.arc(obj.x + obj.width / 2, obj.y - 5, 6 + r * 4, -0.8, 0.8); ctx.stroke(); }
    }
  } else if (obj.type === "computer") {
    ctx.fillStyle = "#0a1218"; ctx.fillRect(obj.x, obj.y, obj.width, obj.height - 6); // monitor
    ctx.fillStyle = "#050f05"; ctx.fillRect(obj.x + 3, obj.y + 3, obj.width - 6, obj.height - 12); // screen
    ctx.fillStyle = "#00ff41"; ctx.globalAlpha = near ? 0.6 : 0.3; ctx.font = "5px monospace";
    for (let l = 0; l < 3; l++) ctx.fillText(">>_data", obj.x + 5, obj.y + 10 + l * 7);
    if (Math.sin(time * 4) > 0) ctx.fillRect(obj.x + 30, obj.y + 8 + (Math.floor(time * 2) % 3) * 7, 4, 5);
    ctx.globalAlpha = near ? 1 : (dist < 250 ? 0.65 : 0.35);
    ctx.fillStyle = "#1a2a1a"; ctx.fillRect(obj.x + 10, obj.y + obj.height - 6, obj.width - 20, 6); // stand
  } else if (obj.type === "document") {
    ctx.fillStyle = near ? "#3a3a2a" : "#2a2a20"; ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 0.5;
    for (let l = 0; l < 6; l++) { ctx.beginPath(); ctx.moveTo(obj.x + 4, obj.y + 4 + l * 3); ctx.lineTo(obj.x + obj.width - 4, obj.y + 4 + l * 3); ctx.stroke(); }
    ctx.strokeStyle = "rgba(179,0,0,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(obj.x + 4, obj.y + 10); ctx.lineTo(obj.x + obj.width - 4, obj.y + 10); ctx.stroke();
    // Folded corner
    ctx.fillStyle = near ? "#4a4a3a" : "#3a3a28";
    ctx.beginPath(); ctx.moveTo(obj.x + obj.width - 8, obj.y); ctx.lineTo(obj.x + obj.width, obj.y); ctx.lineTo(obj.x + obj.width, obj.y + 8); ctx.closePath(); ctx.fill();
  } else if (obj.type === "photo") {
    ctx.fillStyle = "#3a3020"; ctx.fillRect(obj.x - 2, obj.y - 2, obj.width + 4, obj.height + 4);
    ctx.fillStyle = "#2a1a0a"; ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    const sg = ctx.createLinearGradient(obj.x, obj.y, obj.x + obj.width, obj.y + obj.height);
    sg.addColorStop(0, "#3a2a1a"); sg.addColorStop(1, "#2a1a0a"); ctx.fillStyle = sg;
    ctx.fillRect(obj.x + 2, obj.y + 2, obj.width - 4, obj.height - 4);
    // Silhouette figures
    ctx.fillStyle = "#1a0a00"; ctx.fillRect(obj.x + 8, obj.y + obj.height - 15, 8, 12);
    ctx.fillRect(obj.x + 18, obj.y + obj.height - 13, 7, 10);
  } else {
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    ctx.strokeStyle = near ? "#FF1A1A" : "#5a3030"; ctx.lineWidth = near ? 2 : 1; ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
  }

  // Pulsing circle when near
  if (near) {
    const pulse = Math.sin(time * 4) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(196,146,58,${pulse})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, 25, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

function drawDoor(ctx: CanvasRenderingContext2D, door: Door, unlocked: boolean, time: number) {
  if (unlocked) {
    ctx.fillStyle = "#051a05"; ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.strokeStyle = "#00B300"; ctx.lineWidth = 2; ctx.shadowBlur = 10 + Math.sin(time * 3) * 5; ctx.shadowColor = "#00FF00";
    ctx.strokeRect(door.x, door.y, door.width, door.height);
    ctx.fillStyle = "#00FF00"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("SALIDA →", door.x + door.width / 2, door.y - 10); ctx.shadowBlur = 0; ctx.textAlign = "left";
  } else {
    ctx.fillStyle = "#1a0505"; ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.strokeStyle = "#5a0000"; ctx.lineWidth = 2; ctx.strokeRect(door.x, door.y, door.width, door.height);
    ctx.fillStyle = "#B30000"; ctx.shadowBlur = 6; ctx.shadowColor = "#FF1A1A";
    ctx.beginPath(); ctx.arc(door.x + door.width / 2, door.y + door.height / 2 - 5, 7, Math.PI, 0); ctx.stroke();
    ctx.fillRect(door.x + door.width / 2 - 6, door.y + door.height / 2 - 2, 12, 10);
    ctx.fillStyle = "#FF1A1A"; ctx.font = "8px monospace"; ctx.textAlign = "center";
    ctx.fillText("BLOQUEADA", door.x + door.width / 2, door.y - 6); ctx.shadowBlur = 0; ctx.textAlign = "left";
  }
}

function drawNPC(ctx: CanvasRenderingContext2D, npc: NPC, time: number, player: Player) {
  const near = Math.sqrt(Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2)) < INTERACT_RANGE;
  const colors: Record<string, [string, string]> = { hooded: ["#1a0a0a", "#3a1a1a"], vagrant: ["#0a1a0a", "#1a3a1a"], secretary: ["#0a0a1a", "#2a2a3a"], reflection: ["#0a0a2a", "#3a3aff"], figure: ["#1a0a0a", "#ff3333"] };
  const [fill, outline] = colors[npc.type] || ["#1a1a1a", "#444"];
  ctx.fillStyle = fill; ctx.globalAlpha = npc.type === "figure" ? 0.6 : 0.85;
  ctx.fillRect(npc.x + 8, npc.y + 16, 16, 28);
  ctx.beginPath(); ctx.arc(npc.x + 16, npc.y + 10, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 1.5;
  ctx.strokeRect(npc.x + 8, npc.y + 16, 16, 28);
  ctx.beginPath(); ctx.arc(npc.x + 16, npc.y + 10, 10, 0, Math.PI * 2); ctx.stroke();
  if (npc.type === "hooded") { ctx.fillStyle = "#0a0a0a"; ctx.beginPath(); ctx.arc(npc.x + 16, npc.y + 8, 12, Math.PI, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = "#ffffff"; ctx.globalAlpha = 0.8; ctx.fillRect(npc.x + 14, npc.y + 9, 4, 3);
  ctx.globalAlpha = 1;
  if (near) { ctx.fillStyle = "#E5DEC9"; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText("●", npc.x + 16, npc.y - 8); ctx.textAlign = "left"; }
}

function drawPowerUp(ctx: CanvasRenderingContext2D, pu: { x: number; y: number; type: string }, time: number) {
  const colors: Record<string, string> = { speed: "#ff8800", jump: "#4488ff", shield: "#ffffff", vision: "#c4923a" };
  const c = colors[pu.type] || "#fff";
  ctx.save(); ctx.translate(pu.x + 8, pu.y + 8); ctx.rotate(time * 2);
  ctx.fillStyle = c; ctx.globalAlpha = 0.8; ctx.shadowColor = c; ctx.shadowBlur = 12;
  ctx.fillRect(-6, -6, 12, 12); ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.restore();
}

function drawPrompt(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  const w = 70, h = 20;
  ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 4);
  else ctx.rect(x - w / 2, y - h / 2, w, h);
  ctx.fill();
  ctx.strokeStyle = "#c4923a"; ctx.lineWidth = 1;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 4); ctx.stroke(); }
  else ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = "#E5DEC9"; ctx.font = "10px 'Special Elite',serif"; ctx.textAlign = "center";
  ctx.fillText(`[E] ${label}`, x, y + 4); ctx.textAlign = "left";
}

// ═══════════════════════════════════════
// AMBIENT PARTICLES
// ═══════════════════════════════════════
function initAmbient(level: Level, W: number) {
  ambientParts = [];
  const cfg = level.ambientParticles;
  for (let i = 0; i < cfg.count; i++) {
    ambientParts.push({ x: Math.random() * W * 2, y: Math.random() * 600, vy: cfg.type === "rain" ? 4 + Math.random() * 6 : 0.3 + Math.random() * 0.5, vx: cfg.type === "paper" ? (Math.random() - 0.5) * 0.8 : 0, size: cfg.type === "rain" ? 1 : 2 + Math.random() * 2 });
  }
}

function drawAmbient(ctx: CanvasRenderingContext2D, level: Level, cam: Cam, H: number) {
  const cfg = level.ambientParticles;
  ctx.fillStyle = cfg.color;
  for (const p of ambientParts) {
    p.y += p.vy; p.x += p.vx; if (p.y > H) { p.y = -5; p.x = Math.random() * ctx.canvas.width * 2; }
    ctx.globalAlpha = 0.3;
    if (cfg.type === "rain") ctx.fillRect(p.x - cam.x * 0.5, p.y, 1, 8);
    else { ctx.beginPath(); ctx.arc(p.x - cam.x * 0.2, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}
