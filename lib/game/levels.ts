import type { Level } from "./gameTypes";

const G = 520;
const e = (id: string, x: number, pl: number, pr: number, type: "shadow" | "watcher" | "crawler" = "shadow", dmg = 20) => ({
  id, x, y: G - 40, width: 28, height: 40, type, velocityX: 0, velocityY: 0, isOnGround: false,
  health: 1, patrolLeft: pl, patrolRight: pr, direction: 1 as const, state: "patrol" as const,
  detectionRange: 200, damage: dmg, stunnedTimer: 0,
});

export const LEVELS: Level[] = [
  // ═══ NIVEL 1 — EL HOTEL ═══
  {
    id: 1, name: "EL DESPERTAR", backgroundColor: "#050505", groundY: G, exitX: 4800, levelWidth: 5000,
    completionText: "La maleta era tuya. El nombre en el registro, no.",
    platforms: [
      { x: 0, y: G, width: 5000, height: 80 },
      // Zona 1: Lobby
      { x: 150, y: 460, width: 250, height: 20 }, { x: 450, y: 500, width: 80, height: 20 },
      // Zona 2: Pasillo — escalones para subir
      { x: 1050, y: 490, width: 120, height: 15 }, { x: 1200, y: 460, width: 120, height: 15 },
      { x: 1350, y: 430, width: 120, height: 15 }, { x: 1480, y: 400, width: 350, height: 15 },
      { x: 1850, y: 440, width: 120, height: 15 },
      // Zona 3: Habitación
      { x: 2100, y: 480, width: 80, height: 20 }, { x: 2250, y: 470, width: 200, height: 20 },
      { x: 2480, y: 430, width: 80, height: 15 }, { x: 2560, y: 390, width: 100, height: 15 },
      // Zona 4: Baño
      { x: 3150, y: 490, width: 160, height: 20 }, { x: 3400, y: 470, width: 80, height: 20 },
      // Zona 5: Escaleras salida
      { x: 3850, y: 490, width: 140, height: 15 }, { x: 4010, y: 460, width: 140, height: 15 },
      { x: 4170, y: 430, width: 140, height: 15 }, { x: 4330, y: 400, width: 140, height: 15 },
      { x: 4490, y: 370, width: 140, height: 15 }, { x: 4700, y: 340, width: 200, height: 15 },
    ],
    objects: [
      { id: "l1-maleta", x: 2300, y: 450, width: 40, height: 20, type: "item", collected: false, glowing: false, fragmentId: 1, label: "Maleta" },
      { id: "l1-espejo", x: 2580, y: 370, width: 40, height: 20, type: "mirror", collected: false, glowing: false, fragmentId: 2, label: "Espejo roto" },
      { id: "l1-telefono", x: 3420, y: 450, width: 30, height: 20, type: "phone", collected: false, glowing: false, fragmentId: 3, label: "Teléfono" },
    ],
    npcs: [{ id: "l1-hooded", x: 200, y: G - 48, name: "???", dialogues: ["No deberías estar despierto.", "El que duerme no recuerda.", "Busca la maleta, el espejo, la verdad."], currentDialogue: 0, type: "hooded", facingRight: false }],
    enemies: [e("e1a", 700, 500, 900), e("e1b", 2200, 2000, 2500)],
    doors: [{ x: 4800, y: 260, width: 40, height: 80, locked: true, requiredObjects: ["l1-maleta", "l1-espejo", "l1-telefono"], leadsToLevel: 2 }],
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 1500, y: G, activated: false }, { x: 3000, y: G, activated: false }, { x: 4200, y: G, activated: false }],
    powerUps: [{ id: "pu1", x: 1520, y: 380, type: "speed", collected: false, duration: 10 }],
    hideSpots: [{ x: 150, y: 462, width: 200, height: 58 }, { x: 3150, y: 492, width: 150, height: 28 }],
    ambientParticles: { type: "ash", count: 30, color: "#8C8275" },
    bgLayers: [
      { speed: 0.1, elements: [{ x: 0, y: 200, w: 80, h: 320 }, { x: 400, y: 250, w: 60, h: 270 }, { x: 800, y: 180, w: 100, h: 340 }, { x: 1400, y: 220, w: 70, h: 300 }, { x: 2000, y: 240, w: 80, h: 280 }, { x: 2600, y: 200, w: 90, h: 320 }, { x: 3200, y: 230, w: 70, h: 290 }, { x: 3800, y: 210, w: 80, h: 310 }] },
      { speed: 0.3, elements: [{ x: 100, y: 300, w: 40, h: 220, lit: true }, { x: 600, y: 280, w: 50, h: 240, lit: true }, { x: 1200, y: 310, w: 45, h: 210, lit: true }, { x: 2000, y: 290, w: 40, h: 230, lit: true }, { x: 2800, y: 300, w: 50, h: 220, lit: true }, { x: 3600, y: 280, w: 45, h: 240, lit: true }] },
    ],
  },
  // ═══ NIVEL 2 — EL CALLEJÓN ═══
  {
    id: 2, name: "LA CIUDAD", backgroundColor: "#030308", groundY: G, exitX: 4850, levelWidth: 5000,
    completionText: "Alguien te seguía. Tú ya lo sabías.",
    platforms: [
      { x: 0, y: G, width: 5000, height: 80 },
      // Zona 1: Entrada
      { x: 150, y: 480, width: 120, height: 30 }, { x: 300, y: 440, width: 120, height: 30 },
      // Zona 2: Escalera emergencia
      { x: 850, y: 485, width: 130, height: 15 }, { x: 1000, y: 450, width: 130, height: 15 },
      { x: 1150, y: 415, width: 130, height: 15 }, { x: 1300, y: 380, width: 130, height: 15 },
      { x: 1450, y: 345, width: 130, height: 15 }, { x: 1580, y: 320, width: 300, height: 15 },
      // Zona 3: Azoteas
      { x: 1880, y: 300, width: 200, height: 15 }, { x: 2100, y: 320, width: 180, height: 15 },
      { x: 2300, y: 340, width: 100, height: 15 }, { x: 2420, y: 320, width: 200, height: 15 },
      // Bajada escalonada
      { x: 2640, y: 370, width: 100, height: 15 }, { x: 2760, y: 420, width: 100, height: 15 },
      { x: 2880, y: 470, width: 100, height: 15 },
      // Zona 4: Callejón trasero
      { x: 3300, y: 460, width: 180, height: 40 }, { x: 3500, y: 490, width: 100, height: 20 },
      { x: 3620, y: 430, width: 140, height: 30 },
      // Zona 5: Salida — escalones subida
      { x: 4300, y: 480, width: 100, height: 15 }, { x: 4430, y: 450, width: 100, height: 15 },
      { x: 4560, y: 420, width: 100, height: 15 }, { x: 4690, y: 380, width: 200, height: 15 },
    ],
    objects: [
      { id: "l2-periodico", x: 1620, y: 300, width: 35, height: 15, type: "document", collected: false, glowing: false, fragmentId: 4, label: "Periódico" },
      { id: "l2-camara", x: 2150, y: 300, width: 30, height: 20, type: "computer", collected: false, glowing: false, fragmentId: 5, label: "Cámara" },
      { id: "l2-cartera", x: 3650, y: 410, width: 30, height: 20, type: "item", collected: false, glowing: false, fragmentId: 6, label: "Cartera" },
    ],
    npcs: [{ id: "l2-vagrant", x: 600, y: G - 40, name: "Vagabundo", dialogues: ["Yo te conozco.", "Venías aquí todas las noches.", "Tenías sangre en las manos."], currentDialogue: 0, type: "vagrant", facingRight: true }],
    enemies: [e("e2a", 500, 300, 800), e("e2b", 1900, 1880, 2100, "shadow", 20), e("e2c", 3400, 3200, 3700)],
    doors: [{ x: 4850, y: 300, width: 40, height: 80, locked: true, requiredObjects: ["l2-periodico", "l2-camara", "l2-cartera"], leadsToLevel: 3 }],
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 1600, y: 320, activated: false }, { x: 3000, y: G, activated: false }],
    powerUps: [{ id: "pu2", x: 2440, y: 300, type: "jump", collected: false, duration: 8 }],
    hideSpots: [{ x: 300, y: 442, width: 100, height: 78 }, { x: 3300, y: 462, width: 160, height: 58 }],
    ambientParticles: { type: "rain", count: 60, color: "#4060a0" },
    bgLayers: [
      { speed: 0.1, elements: [{ x: 0, y: 150, w: 120, h: 370 }, { x: 500, y: 180, w: 80, h: 340 }, { x: 1000, y: 130, w: 100, h: 390 }, { x: 1500, y: 160, w: 90, h: 360 }, { x: 2000, y: 140, w: 110, h: 380 }, { x: 2500, y: 170, w: 85, h: 350 }, { x: 3000, y: 150, w: 100, h: 370 }, { x: 3500, y: 160, w: 90, h: 360 }, { x: 4000, y: 140, w: 100, h: 380 }] },
      { speed: 0.3, elements: [{ x: 200, y: 250, w: 50, h: 270, lit: true }, { x: 800, y: 270, w: 40, h: 250, lit: true }, { x: 1500, y: 260, w: 45, h: 260, lit: true }, { x: 2200, y: 250, w: 50, h: 270, lit: true }, { x: 3200, y: 260, w: 40, h: 260, lit: true }] },
    ],
  },
  // ═══ NIVEL 3 — LA OFICINA ═══
  {
    id: 3, name: "LOS DOCUMENTOS", backgroundColor: "#050502", groundY: G, exitX: 4200, levelWidth: 4500,
    completionText: "Los documentos no mienten. Tú sí.",
    platforms: [
      { x: 0, y: G, width: 4500, height: 80 },
      // Zona 1: Recepción
      { x: 200, y: 470, width: 200, height: 20 }, { x: 450, y: 500, width: 60, height: 20 },
      // Zona 2: Sala principal — escritorios escalonados
      { x: 950, y: 480, width: 150, height: 20 }, { x: 1150, y: 460, width: 150, height: 15 },
      { x: 1350, y: 440, width: 80, height: 30 }, { x: 1460, y: 410, width: 100, height: 15 },
      { x: 1580, y: 380, width: 200, height: 15 }, { x: 1820, y: 460, width: 150, height: 15 },
      // Zona 3: Servidores — escalones
      { x: 2250, y: 470, width: 100, height: 30 }, { x: 2380, y: 440, width: 100, height: 20 },
      { x: 2510, y: 410, width: 100, height: 20 }, { x: 2650, y: 380, width: 250, height: 15 },
      // Zona 4: Archivo
      { x: 3100, y: 470, width: 120, height: 15 }, { x: 3250, y: 440, width: 120, height: 15 },
      { x: 3400, y: 410, width: 120, height: 15 }, { x: 3550, y: 380, width: 150, height: 15 },
      // Escalones a puerta
      { x: 3800, y: 400, width: 120, height: 15 }, { x: 3940, y: 370, width: 120, height: 15 },
      { x: 4080, y: 340, width: 150, height: 15 },
    ],
    objects: [
      { id: "l3-expediente", x: 1620, y: 360, width: 40, height: 20, type: "document", collected: false, glowing: false, fragmentId: 7, label: "Expediente" },
      { id: "l3-computadora", x: 2700, y: 360, width: 45, height: 20, type: "computer", collected: false, glowing: false, fragmentId: 8, label: "Computadora" },
      { id: "l3-foto", x: 3580, y: 360, width: 35, height: 20, type: "photo", collected: false, glowing: false, fragmentId: 9, label: "Foto enmarcada" },
    ],
    npcs: [{ id: "l3-secretary", x: 700, y: G - 48, name: "Secretaria", dialogues: ["No hay cita.", "Ese nombre ya no existe.", "Vete antes de que regrese."], currentDialogue: 0, type: "secretary", facingRight: false }],
    enemies: [e("e3a", 1000, 800, 1300, "shadow", 25), e("e3b", 2600, 2400, 2900, "shadow", 25)],
    doors: [{ x: 4200, y: 260, width: 40, height: 80, locked: true, requiredObjects: ["l3-expediente", "l3-computadora", "l3-foto"], leadsToLevel: 4 }],
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 1500, y: G, activated: false }, { x: 2800, y: G, activated: false }],
    powerUps: [{ id: "pu3", x: 2680, y: 360, type: "shield", collected: false, duration: 15 }],
    hideSpots: [{ x: 1350, y: 442, width: 80, height: 78 }],
    ambientParticles: { type: "paper", count: 15, color: "#E5DEC9" },
    bgLayers: [{ speed: 0.1, elements: [{ x: 0, y: 200, w: 300, h: 320 }, { x: 600, y: 200, w: 300, h: 320 }, { x: 1200, y: 200, w: 300, h: 320 }, { x: 1800, y: 200, w: 300, h: 320 }, { x: 2400, y: 200, w: 300, h: 320 }, { x: 3000, y: 200, w: 300, h: 320 }] }],
  },
  // ═══ NIVEL 4 — EL VACÍO ═══
  {
    id: 4, name: "EL VACÍO", backgroundColor: "#000000", groundY: 700, exitX: 3730, levelWidth: 4000,
    completionText: "El vacío no estaba fuera. Estaba dentro.",
    platforms: [
      // Spawn area
      { x: 50, y: 450, width: 200, height: 15 },
      // Ruta A: gaps 100-120px, height diff 20-30px
      { x: 270, y: 430, width: 120, height: 15 }, { x: 410, y: 400, width: 100, height: 15 },
      { x: 530, y: 420, width: 120, height: 15 }, { x: 670, y: 390, width: 100, height: 15 },
      { x: 790, y: 360, width: 120, height: 15 }, { x: 930, y: 380, width: 120, height: 15 },
      // Ruta B: gaps 110-140px
      { x: 1070, y: 350, width: 100, height: 15 }, { x: 1200, y: 330, width: 100, height: 15 },
      { x: 1330, y: 350, width: 100, height: 15 }, { x: 1460, y: 320, width: 100, height: 15 },
      { x: 1580, y: 340, width: 120, height: 15 }, { x: 1720, y: 310, width: 100, height: 15 },
      { x: 1850, y: 330, width: 120, height: 15 },
      // Ruta C: flickering
      { x: 2000, y: 310, width: 80, height: 15, type: "flickering" },
      { x: 2110, y: 290, width: 80, height: 15, type: "flickering" },
      { x: 2220, y: 310, width: 80, height: 15, type: "flickering" },
      { x: 2330, y: 280, width: 80, height: 15, type: "flickering" },
      { x: 2440, y: 300, width: 100, height: 15 }, // solid rest
      { x: 2570, y: 280, width: 80, height: 15, type: "flickering" },
      { x: 2680, y: 260, width: 80, height: 15, type: "flickering" },
      { x: 2800, y: 280, width: 120, height: 15 }, // solid rest
      // Final
      { x: 2950, y: 260, width: 100, height: 15 }, { x: 3080, y: 240, width: 100, height: 15 },
      { x: 3210, y: 260, width: 100, height: 15 }, { x: 3340, y: 240, width: 100, height: 15 },
      { x: 3470, y: 220, width: 120, height: 15 }, { x: 3620, y: 240, width: 150, height: 15 },
    ],
    objects: [
      { id: "l4-luz1", x: 800, y: 340, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 10, label: "Fragmento de luz" },
      { id: "l4-luz2", x: 1730, y: 290, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 11, label: "Fragmento de luz" },
      { id: "l4-luz3", x: 2450, y: 280, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 12, label: "Fragmento de luz" },
    ],
    npcs: [{ id: "l4-reflection", x: 3640, y: 240 - 48, name: "Tu reflejo", dialogues: ["¿Me reconoces?", "Cada puerta que abriste, yo cerré otra.", "Yo soy tú."], currentDialogue: 0, type: "reflection", facingRight: false }],
    enemies: [
      { ...e("e4a", 530, 410, 670, "crawler", 15), y: 420 - 40 },
      { ...e("e4b", 1460, 1330, 1580, "crawler", 15), y: 320 - 40 },
      { ...e("e4c", 2440, 2330, 2570, "crawler", 15), y: 300 - 40 },
    ],
    doors: [{ x: 3730, y: 160, width: 40, height: 80, locked: true, requiredObjects: ["l4-luz1", "l4-luz2", "l4-luz3"], leadsToLevel: 5 }],
    checkpoints: [{ x: 100, y: 450, activated: false }, { x: 930, y: 380, activated: false }, { x: 1850, y: 330, activated: false }, { x: 2800, y: 280, activated: false }],
    powerUps: [{ id: "pu4", x: 2460, y: 280, type: "vision", collected: false, duration: 12 }],
    ambientParticles: { type: "stars", count: 40, color: "#E5DEC9" },
    bgLayers: [],
  },
  // ═══ NIVEL 5 — LA VERDAD ═══
  {
    id: 5, name: "LA VERDAD", backgroundColor: "#020005", groundY: G, exitX: 3950, levelWidth: 4000,
    completionText: "Ahora recuerdas. Ojalá no lo hubieras hecho.",
    platforms: [
      { x: 0, y: G, width: 4000, height: 80 },
      // Zona 1: Ruinas
      { x: 200, y: 480, width: 100, height: 20 }, { x: 350, y: 460, width: 100, height: 15 },
      { x: 500, y: 440, width: 100, height: 15 },
      // Zona 2: Ascenso escalonado
      { x: 1050, y: 490, width: 90, height: 15 }, { x: 1170, y: 455, width: 90, height: 15 },
      { x: 1300, y: 420, width: 90, height: 15 }, { x: 1440, y: 390, width: 90, height: 15 },
      { x: 1590, y: 355, width: 90, height: 15 }, { x: 1740, y: 325, width: 120, height: 15 },
      // Objetos
      { x: 1900, y: 360, width: 90, height: 15 }, { x: 2050, y: 330, width: 150, height: 15 },
      { x: 2250, y: 350, width: 120, height: 15 }, { x: 2400, y: 370, width: 100, height: 15 },
      { x: 2550, y: 340, width: 120, height: 15 },
      // Pre-boss descent
      { x: 2700, y: 380, width: 100, height: 15 }, { x: 2830, y: 420, width: 100, height: 15 },
      // Boss area refugio platforms
      { x: 3100, y: 430, width: 100, height: 15 }, { x: 3500, y: 420, width: 100, height: 15 },
      { x: 3850, y: 440, width: 100, height: 15 },
    ],
    objects: [
      { id: "l5-pieza1", x: 520, y: 420, width: 25, height: 20, type: "light", collected: false, glowing: true, fragmentId: 13, label: "Pieza de identidad" },
      { id: "l5-pieza2", x: 2080, y: 310, width: 25, height: 20, type: "light", collected: false, glowing: true, fragmentId: 14, label: "Pieza de identidad" },
      { id: "l5-pieza3", x: 2570, y: 320, width: 25, height: 20, type: "light", collected: false, glowing: true, fragmentId: 15, label: "Pieza de identidad" },
    ],
    npcs: [{ id: "l5-figure", x: 200, y: G - 60, name: "La Verdad", dialogues: ["Has llegado al final.", "Cada objeto era un fragmento de ti.", "¿Puedes vivir con la verdad?"], currentDialogue: 0, type: "figure", facingRight: true }],
    enemies: [e("e5a", 800, 600, 1000, "shadow", 30), e("e5b", 1500, 1300, 1700, "shadow", 30), { ...e("e5c", 2400, 2250, 2600, "crawler", 20), y: G - 40 }],
    doors: [{ x: 3950, y: G - 80, width: 40, height: 80, locked: true, requiredObjects: ["l5-pieza1", "l5-pieza2", "l5-pieza3"], leadsToLevel: 6 }],
    boss: { active: false, x: 3400, y: G - 90, width: 60, height: 90, velocityX: 0, velocityY: 0, maxHealth: 100, currentHealth: 100, phase: 1, attackTimer: 3, state: "idle", stunnedTimer: 0, direction: -1 },
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 1740, y: 325, activated: false }, { x: 2700, y: G, activated: false }],
    powerUps: [{ id: "pu5", x: 1760, y: 305, type: "speed", collected: false, duration: 10 }],
    ambientParticles: { type: "dust", count: 25, color: "#B30000" },
    bgLayers: [{ speed: 0.05, elements: [{ x: 0, y: 100, w: 400, h: 420 }, { x: 700, y: 80, w: 500, h: 440 }, { x: 1400, y: 100, w: 400, h: 420 }, { x: 2200, y: 90, w: 450, h: 430 }, { x: 3000, y: 100, w: 400, h: 420 }] }],
  },
];
