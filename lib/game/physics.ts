import type { Player, Platform, InteractiveObject, NPC, Door, Checkpoint } from "./gameTypes";
import { GRAVITY, MAX_FALL_SPEED, MOVE_SPEED, JUMP_FORCE, FRICTION, INTERACT_RANGE } from "./gameTypes";

export function updatePlayer(
  player: Player,
  left: boolean,
  right: boolean,
  jumpPressed: boolean,
  platforms: Platform[],
  dt: number,
  time: number,
  canvasHeight: number
): Player {
  const p = { ...player };

  if (p.isDead) return p;

  // Invincibility timer
  if (p.isInvincible) {
    p.invincibleTimer -= dt;
    if (p.invincibleTimer <= 0) {
      p.isInvincible = false;
      p.invincibleTimer = 0;
    }
  }

  // Horizontal movement
  if (left) {
    p.velocityX = -MOVE_SPEED;
    p.facingRight = false;
    p.state = "walking";
  } else if (right) {
    p.velocityX = MOVE_SPEED;
    p.facingRight = true;
    p.state = "walking";
  } else {
    p.state = p.isOnGround ? "idle" : "jumping";
  }

  // Jump
  if (jumpPressed && p.isOnGround) {
    p.velocityY = JUMP_FORCE;
    p.isOnGround = false;
    p.state = "jumping";
  }

  // Gravity — only if not on ground
  if (!p.isOnGround) {
    p.velocityY += GRAVITY * dt;
    if (p.velocityY > MAX_FALL_SPEED) p.velocityY = MAX_FALL_SPEED;
  }

  // Store previous bottom position for one-way platform detection
  const prevBottom = p.y + p.height;

  // Apply velocity
  p.x += p.velocityX * dt;
  p.y += p.velocityY * dt;

  // Friction
  p.velocityX *= FRICTION;
  if (Math.abs(p.velocityX) < 1) p.velocityX = 0;

  // Blink timer
  p.blinkTimer -= dt;
  if (p.blinkTimer <= 0) p.blinkTimer = 3 + Math.random() * 2;

  // Reset ground state before checking collisions
  p.isOnGround = false;

  // Platform collision (top-down only — player lands on top)
  const currBottom = p.y + p.height;

  for (const plat of platforms) {
    // Skip flickering platforms that are "off"
    if (plat.type === "flickering" && Math.sin(time * 2 + plat.x * 0.01) < -0.3) continue;

    const overlapX = p.x + p.width > plat.x && p.x < plat.x + plat.width;
    const wasAbove = prevBottom <= plat.y + 4;
    const isNowBelow = currBottom >= plat.y;
    const fallingDown = p.velocityY >= 0;

    if (overlapX && wasAbove && isNowBelow && fallingDown) {
      p.y = plat.y - p.height;
      p.velocityY = 0;
      p.isOnGround = true;
      break;
    }
  }

  // Left boundary
  if (p.x < 0) p.x = 0;

  // Fell off the world — take damage
  if (p.y > canvasHeight + 100) {
    p.health -= 25;
    if (p.health <= 0) {
      p.health = 0;
      p.isDead = true;
    }
    // Will be respawned by caller
  }

  return p;
}

export function respawnPlayer(player: Player, checkpoints: Checkpoint[]): Player {
  const lastCheckpoint = [...checkpoints].reverse().find((cp) => cp.activated);
  const spawnX = lastCheckpoint?.x ?? 100;
  const spawnY = lastCheckpoint?.y ?? 460;

  return {
    ...player,
    x: spawnX,
    y: spawnY - player.height,
    velocityX: 0,
    velocityY: 0,
    isOnGround: false,
    isInvincible: true,
    invincibleTimer: 1.5,
    health: player.isDead ? player.maxHealth : player.health,
    isDead: false,
    state: "idle",
  };
}

export function updateCheckpoints(player: Player, checkpoints: Checkpoint[]): void {
  for (const cp of checkpoints) {
    if (!cp.activated && player.x >= cp.x - 20) {
      cp.activated = true;
    }
  }
}

export function findNearbyObject(player: Player, objects: InteractiveObject[]): InteractiveObject | null {
  for (const obj of objects) {
    if (obj.collected) continue;
    const dx = (player.x + player.width / 2) - (obj.x + obj.width / 2);
    const dy = (player.y + player.height / 2) - (obj.y + obj.height / 2);
    if (Math.sqrt(dx * dx + dy * dy) < INTERACT_RANGE) return obj;
  }
  return null;
}

export function findNearbyNPC(player: Player, npcs: NPC[]): NPC | null {
  for (const npc of npcs) {
    const dx = (player.x + player.width / 2) - (npc.x + 16);
    const dy = (player.y + player.height / 2) - (npc.y + 24);
    if (Math.sqrt(dx * dx + dy * dy) < INTERACT_RANGE) return npc;
  }
  return null;
}

export function checkDoor(player: Player, doors: Door[], collectedIds: Set<string>): Door | null {
  for (const door of doors) {
    if (player.x + player.width > door.x && player.x < door.x + door.width) {
      const allCollected = door.requiredObjects.every((id) => collectedIds.has(id));
      if (allCollected) { door.locked = false; return door; }
    }
  }
  return null;
}
