import type { Player, Platform, InputState, InteractiveObject, NPC, Door } from "./gameTypes";
import { GRAVITY, MOVE_SPEED, JUMP_FORCE, FRICTION, INTERACT_RANGE } from "./gameTypes";

export function updatePlayer(player: Player, input: InputState, platforms: Platform[], dt: number, time: number): void {
  // Horizontal movement
  if (input.left) {
    player.velocityX = -MOVE_SPEED;
    player.facingRight = false;
    player.state = "walking";
  } else if (input.right) {
    player.velocityX = MOVE_SPEED;
    player.facingRight = true;
    player.state = "walking";
  } else {
    player.state = player.isOnGround ? "idle" : "jumping";
  }

  // Jump
  if (input.jump && player.isOnGround) {
    player.velocityY = JUMP_FORCE;
    player.isOnGround = false;
    player.state = "jumping";
  }

  // Gravity
  player.velocityY += GRAVITY * dt;

  // Apply velocity
  player.x += player.velocityX * dt;
  player.y += player.velocityY * dt;

  // Friction
  player.velocityX *= FRICTION;

  // Blink timer
  player.blinkTimer -= dt;
  if (player.blinkTimer <= 0) player.blinkTimer = 3 + Math.random() * 2;

  // Platform collision
  player.isOnGround = false;
  for (const plat of platforms) {
    // Skip flickering platforms that are "off"
    if (plat.type === "flickering" && Math.sin(time * 2 + plat.x * 0.01) < -0.3) continue;

    if (
      player.x + player.width > plat.x &&
      player.x < plat.x + plat.width &&
      player.y + player.height > plat.y &&
      player.y + player.height < plat.y + plat.height + 20 &&
      player.velocityY >= 0
    ) {
      player.y = plat.y - player.height;
      player.velocityY = 0;
      player.isOnGround = true;
    }
  }

  // Clamp to world
  if (player.x < 0) player.x = 0;
  if (player.y > 600) { player.y = 400; player.velocityY = 0; }
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
      const allCollected = door.requiredObjects.every(id => collectedIds.has(id));
      if (allCollected) { door.locked = false; return door; }
    }
  }
  return null;
}
