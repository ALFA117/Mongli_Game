import type { Player, Platform, InteractiveObject, NPC, Door, Level, BackgroundLayer, ParticleConfig } from "./gameTypes";
import { INTERACT_RANGE } from "./gameTypes";

interface Camera { x: number; y: number }
interface Particle { x: number; y: number; vy: number; vx: number; opacity: number; size: number }

let particles: Particle[] = [];
let particlesInit = false;

function initParticles(config: ParticleConfig, canvasW: number) {
  particles = [];
  for (let i = 0; i < config.count; i++) {
    particles.push({
      x: Math.random() * canvasW * 2,
      y: Math.random() * 600,
      vy: config.type === "rain" ? 4 + Math.random() * 6 : 0.3 + Math.random() * 0.5,
      vx: config.type === "paper" ? (Math.random() - 0.5) * 0.8 : 0,
      opacity: 0.2 + Math.random() * 0.4,
      size: config.type === "rain" ? 1 : 2 + Math.random() * 2,
    });
  }
  particlesInit = true;
}

export function render(
  ctx: CanvasRenderingContext2D,
  level: Level,
  player: Player,
  cam: Camera,
  time: number,
  nearObj: InteractiveObject | null,
  nearNPC: NPC | null,
  collectedIds: Set<string>
) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Clear
  ctx.fillStyle = level.backgroundColor;
  ctx.fillRect(0, 0, W, H);

  // Parallax backgrounds
  for (const layer of level.bgLayers) {
    drawBgLayer(ctx, layer, cam, W, H);
  }

  // Particles
  if (!particlesInit) initParticles(level.ambientParticles, W);
  drawParticles(ctx, level.ambientParticles, cam, W, H);

  ctx.save();
  ctx.translate(-cam.x, -cam.y);

  // Platforms
  for (const plat of level.platforms) {
    drawPlatform(ctx, plat, time);
  }

  // Doors
  for (const door of level.doors) {
    const unlocked = door.requiredObjects.every(id => collectedIds.has(id));
    drawDoor(ctx, door, unlocked, time);
  }

  // Objects
  for (const obj of level.objects) {
    if (!obj.collected) drawObject(ctx, obj, player, time);
  }

  // NPCs
  for (const npc of level.npcs) {
    drawNPC(ctx, npc, player, time);
  }

  // Player
  drawPlayer(ctx, player, time);

  // Interact hint
  if (nearObj && !nearObj.collected) {
    drawHint(ctx, nearObj.x + nearObj.width / 2, nearObj.y - 20, `[E] ${nearObj.label}`);
  }
  if (nearNPC) {
    drawHint(ctx, nearNPC.x + 16, nearNPC.y - 20, `[E] Hablar`);
  }

  ctx.restore();
}

function drawBgLayer(ctx: CanvasRenderingContext2D, layer: BackgroundLayer, cam: Camera, W: number, H: number) {
  ctx.save();
  for (const el of layer.elements) {
    const sx = el.x - cam.x * layer.speed;
    ctx.fillStyle = "#080808";
    ctx.fillRect(sx, el.y, el.w, el.h);
    if (el.lit) {
      // Windows
      for (let wy = el.y + 20; wy < el.y + el.h - 20; wy += 40) {
        for (let wx = sx + 8; wx < sx + el.w - 8; wx += 18) {
          ctx.fillStyle = "rgba(196,146,58,0.15)";
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }
  }
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, config: ParticleConfig, cam: Camera, W: number, H: number) {
  for (const p of particles) {
    p.y += p.vy;
    p.x += p.vx;
    if (p.y > H) { p.y = -5; p.x = Math.random() * W * 2; }
    if (p.x > W * 2) p.x = 0;

    ctx.fillStyle = config.color;
    ctx.globalAlpha = p.opacity;
    if (config.type === "rain") {
      ctx.fillRect(p.x - cam.x * 0.5, p.y, 1, 8);
    } else {
      ctx.beginPath();
      ctx.arc(p.x - cam.x * 0.2, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, plat: Platform, time: number) {
  if (plat.type === "flickering") {
    const visible = Math.sin(time * 2 + plat.x * 0.01) > -0.3;
    ctx.globalAlpha = visible ? 0.4 + Math.sin(time * 3) * 0.2 : 0.05;
  }
  ctx.fillStyle = plat.y >= 490 ? "#0a0a0a" : "#1a1a1a";
  ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
  // Top edge highlight
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(plat.x, plat.y, plat.width, 2);
  ctx.globalAlpha = 1;
}

function drawDoor(ctx: CanvasRenderingContext2D, door: Door, unlocked: boolean, time: number) {
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(door.x, door.y, door.width, door.height);
  ctx.strokeStyle = unlocked ? "#E5DEC9" : "#B30000";
  ctx.lineWidth = 2;
  ctx.strokeRect(door.x, door.y, door.width, door.height);

  if (unlocked) {
    ctx.shadowBlur = 10 + Math.sin(time * 3) * 5;
    ctx.shadowColor = "#E5DEC9";
    ctx.fillStyle = "#E5DEC9";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SALIDA →", door.x + door.width / 2, door.y - 8);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#B30000";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#FF1A1A";
    ctx.beginPath();
    ctx.arc(door.x + door.width / 2, door.y + door.height / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawObject(ctx: CanvasRenderingContext2D, obj: InteractiveObject, player: Player, time: number) {
  const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
  const dy = (player.y + player.height / 2) - (obj.y + obj.height / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const near = dist < INTERACT_RANGE;

  if (near || obj.glowing) {
    ctx.shadowBlur = 12 + Math.sin(time * 4) * 4;
    ctx.shadowColor = "#FF1A1A";
  }

  ctx.fillStyle = obj.type === "light" ? "#FF1A1A" : "#E5DEC9";
  ctx.globalAlpha = near ? 0.9 : 0.4;

  if (obj.type === "light") {
    ctx.beginPath();
    ctx.arc(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawNPC(ctx: CanvasRenderingContext2D, npc: NPC, player: Player, time: number) {
  const x = npc.x;
  const y = npc.y;

  ctx.fillStyle = npc.type === "reflection" ? "#3060a0" : "#E5DEC9";
  ctx.globalAlpha = npc.type === "figure" ? 0.5 : 0.8;

  // Body
  ctx.fillRect(x + 8, y + 16, 16, 28);
  // Head
  ctx.beginPath();
  ctx.arc(x + 16, y + 10, 10, 0, Math.PI * 2);
  ctx.fill();

  if (npc.type === "hooded") {
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(x + 16, y + 8, 12, Math.PI, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = "#FF1A1A";
  ctx.globalAlpha = 0.8;
  ctx.fillRect(x + 12, y + 9, 2, 2);
  ctx.fillRect(x + 18, y + 9, 2, 2);

  ctx.globalAlpha = 1;
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player, time: number) {
  const x = player.x;
  const y = player.y;

  ctx.save();
  if (!player.facingRight) {
    ctx.translate(x + player.width, 0);
    ctx.scale(-1, 1);
    ctx.translate(-x, 0);
  }

  ctx.fillStyle = "#E5DEC9";

  // Body
  ctx.fillRect(x + 8, y + 18, 16, 26);

  // Head
  ctx.beginPath();
  ctx.arc(x + 16, y + 12, 10, 0, Math.PI * 2);
  ctx.fill();

  // Legs animation
  if (player.state === "walking") {
    const legAnim = Math.sin(time * 10) * 4;
    ctx.fillRect(x + 8, y + 44, 6, 8 + legAnim);
    ctx.fillRect(x + 18, y + 44, 6, 8 - legAnim);
  } else {
    ctx.fillRect(x + 8, y + 44, 6, 6);
    ctx.fillRect(x + 18, y + 44, 6, 6);
  }

  // Eyes
  const blinking = player.blinkTimer < 0.15;
  if (!blinking) {
    ctx.fillStyle = "#FF1A1A";
    ctx.shadowBlur = 4;
    ctx.shadowColor = "#FF1A1A";
    ctx.fillRect(x + 12, y + 10, 3, 3);
    ctx.fillRect(x + 19, y + 10, 3, 3);
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

function drawHint(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  ctx.fillStyle = "#B30000";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.shadowBlur = 6;
  ctx.shadowColor = "#FF1A1A";
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

export function resetParticles() {
  particlesInit = false;
}
