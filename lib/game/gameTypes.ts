export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  isOnGround: boolean;
  facingRight: boolean;
  state: "idle" | "walking" | "jumping" | "interacting";
  memoryFragments: number;
  blinkTimer: number;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: "solid" | "flickering";
}

export interface InteractiveObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "item" | "mirror" | "phone" | "computer" | "photo" | "document" | "light";
  collected: boolean;
  glowing: boolean;
  fragmentId: number;
  label: string;
}

export interface NPC {
  id: string;
  x: number;
  y: number;
  name: string;
  dialogues: string[];
  currentDialogue: number;
  type: "hooded" | "vagrant" | "secretary" | "reflection" | "figure";
  facingRight: boolean;
}

export interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
  locked: boolean;
  requiredObjects: string[];
  leadsToLevel: number;
}

export interface ParticleConfig {
  type: "ash" | "rain" | "paper" | "stars" | "dust";
  count: number;
  color: string;
}

export interface BackgroundLayer {
  speed: number;
  elements: { x: number; y: number; w: number; h: number; lit?: boolean }[];
}

export interface Level {
  id: number;
  name: string;
  backgroundColor: string;
  platforms: Platform[];
  objects: InteractiveObject[];
  npcs: NPC[];
  doors: Door[];
  ambientParticles: ParticleConfig;
  bgLayers: BackgroundLayer[];
  exitX: number;
  groundY: number;
}

export interface GameState {
  currentLevel: number;
  player: Player;
  camera: { x: number; y: number };
  paused: boolean;
  dialogActive: boolean;
  dialogText: string;
  dialogSpeaker: string;
  dialogComplete: boolean;
  notifications: { text: string; timer: number }[];
  totalCollected: number;
  gameComplete: boolean;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  interact: boolean;
}

export const GRAVITY = 800;
export const MOVE_SPEED = 200;
export const JUMP_FORCE = -450;
export const FRICTION = 0.85;
export const INTERACT_RANGE = 80;
