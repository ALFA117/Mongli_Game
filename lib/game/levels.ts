import type { Level } from "./gameTypes";

const G = 520; // ground surface Y

export const LEVELS: Level[] = [
  {
    id: 1, name: "EL DESPERTAR", backgroundColor: "#050505", groundY: G, exitX: 1800, levelWidth: 2200,
    platforms: [
      { x: 0, y: G, width: 2200, height: 80 },
      { x: 200, y: 400, width: 160, height: 14 },
      { x: 500, y: 360, width: 200, height: 14 },
      { x: 900, y: 420, width: 140, height: 14 },
      { x: 1300, y: 380, width: 180, height: 14 },
    ],
    checkpoints: [
      { x: 100, y: G, activated: false },
      { x: 600, y: G, activated: false },
      { x: 1200, y: G, activated: false },
    ],
    objects: [
      { id: "l1-maleta", x: 300, y: G - 30, width: 40, height: 30, type: "item", collected: false, glowing: false, fragmentId: 1, label: "Maleta" },
      { id: "l1-espejo", x: 700, y: 320, width: 50, height: 70, type: "mirror", collected: false, glowing: false, fragmentId: 2, label: "Espejo roto" },
      { id: "l1-telefono", x: 1100, y: G - 25, width: 30, height: 25, type: "phone", collected: false, glowing: false, fragmentId: 3, label: "Teléfono" },
    ],
    npcs: [
      { id: "l1-hooded", x: 1500, y: G - 48, name: "???", dialogues: [
        "No deberías estar despierto.",
        "El que duerme no recuerda. Y el que recuerda no duerme.",
        "Busca la maleta. Busca el espejo. Busca la verdad.",
      ], currentDialogue: 0, type: "hooded", facingRight: false },
    ],
    doors: [{ x: 1800, y: G - 80, width: 40, height: 80, locked: true, requiredObjects: ["l1-maleta", "l1-espejo", "l1-telefono"], leadsToLevel: 2 }],
    ambientParticles: { type: "ash", count: 30, color: "#8C8275" },
    bgLayers: [
      { speed: 0.1, elements: [{ x: 0, y: 200, w: 80, h: 320 }, { x: 300, y: 250, w: 60, h: 270 }, { x: 600, y: 180, w: 100, h: 340 }, { x: 1000, y: 220, w: 70, h: 300 }, { x: 1400, y: 240, w: 80, h: 280 }] },
      { speed: 0.3, elements: [{ x: 100, y: 300, w: 40, h: 220, lit: true }, { x: 500, y: 280, w: 50, h: 240, lit: true }, { x: 900, y: 310, w: 45, h: 210, lit: true }] },
    ],
  },
  {
    id: 2, name: "LA CIUDAD", backgroundColor: "#030308", groundY: G, exitX: 2000, levelWidth: 2400,
    platforms: [
      { x: 0, y: G, width: 2400, height: 80 },
      { x: 150, y: 440, width: 120, height: 14 },
      { x: 400, y: 380, width: 100, height: 14 },
      { x: 600, y: 320, width: 100, height: 14 },
      { x: 850, y: 380, width: 120, height: 14 },
      { x: 1100, y: 340, width: 150, height: 14 },
      { x: 1500, y: 400, width: 100, height: 14 },
    ],
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 700, y: G, activated: false }, { x: 1400, y: G, activated: false }],
    objects: [
      { id: "l2-periodico", x: 250, y: G - 15, width: 35, height: 15, type: "document", collected: false, glowing: false, fragmentId: 4, label: "Periódico" },
      { id: "l2-camara", x: 750, y: 280, width: 30, height: 30, type: "computer", collected: false, glowing: false, fragmentId: 5, label: "Cámara de seguridad" },
      { id: "l2-cartera", x: 1300, y: G - 20, width: 30, height: 20, type: "item", collected: false, glowing: false, fragmentId: 6, label: "Cartera perdida" },
    ],
    npcs: [{ id: "l2-vagrant", x: 500, y: G - 40, name: "Vagabundo", dialogues: ["Yo te conozco.", "Antes venías aquí todas las noches.", "La última vez tenías sangre en las manos."], currentDialogue: 0, type: "vagrant", facingRight: true }],
    doors: [{ x: 2000, y: G - 80, width: 40, height: 80, locked: true, requiredObjects: ["l2-periodico", "l2-camara", "l2-cartera"], leadsToLevel: 3 }],
    ambientParticles: { type: "rain", count: 60, color: "#4060a0" },
    bgLayers: [
      { speed: 0.1, elements: [{ x: 0, y: 150, w: 120, h: 370 }, { x: 400, y: 180, w: 80, h: 340 }, { x: 800, y: 130, w: 100, h: 390 }, { x: 1200, y: 160, w: 90, h: 360 }, { x: 1600, y: 170, w: 85, h: 350 }] },
      { speed: 0.3, elements: [{ x: 200, y: 250, w: 50, h: 270, lit: true }, { x: 600, y: 270, w: 40, h: 250, lit: true }, { x: 1000, y: 260, w: 45, h: 260, lit: true }] },
    ],
  },
  {
    id: 3, name: "LOS DOCUMENTOS", backgroundColor: "#050502", groundY: G, exitX: 1600, levelWidth: 1800,
    platforms: [
      { x: 0, y: G, width: 1800, height: 80 },
      { x: 200, y: 420, width: 200, height: 14 },
      { x: 500, y: 370, width: 180, height: 14 },
      { x: 800, y: 400, width: 160, height: 14 },
      { x: 1100, y: 360, width: 200, height: 14 },
    ],
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 600, y: G, activated: false }, { x: 1200, y: G, activated: false }],
    objects: [
      { id: "l3-expediente", x: 350, y: 390, width: 40, height: 25, type: "document", collected: false, glowing: false, fragmentId: 7, label: "Expediente" },
      { id: "l3-computadora", x: 680, y: 335, width: 45, height: 35, type: "computer", collected: false, glowing: false, fragmentId: 8, label: "Computadora encendida" },
      { id: "l3-foto", x: 1000, y: G - 40, width: 35, height: 45, type: "photo", collected: false, glowing: false, fragmentId: 9, label: "Foto enmarcada" },
    ],
    npcs: [{ id: "l3-secretary", x: 1200, y: G - 48, name: "Secretaria", dialogues: ["No hay cita programada.", "...ese nombre ya no existe en el sistema.", "Vete antes de que regrese."], currentDialogue: 0, type: "secretary", facingRight: false }],
    doors: [{ x: 1600, y: G - 80, width: 40, height: 80, locked: true, requiredObjects: ["l3-expediente", "l3-computadora", "l3-foto"], leadsToLevel: 4 }],
    ambientParticles: { type: "paper", count: 15, color: "#E5DEC9" },
    bgLayers: [{ speed: 0.1, elements: [{ x: 0, y: 200, w: 300, h: 320 }, { x: 500, y: 200, w: 300, h: 320 }, { x: 1000, y: 200, w: 300, h: 320 }] }],
  },
  {
    id: 4, name: "EL VACÍO", backgroundColor: "#000000", groundY: G, exitX: 1800, levelWidth: 2000,
    platforms: [
      { x: 0, y: G, width: 300, height: 80 },
      { x: 400, y: 470, width: 120, height: 14, type: "flickering" },
      { x: 600, y: 420, width: 100, height: 14, type: "flickering" },
      { x: 800, y: 370, width: 120, height: 14, type: "flickering" },
      { x: 1000, y: 420, width: 100, height: 14, type: "flickering" },
      { x: 1200, y: 470, width: 120, height: 14, type: "flickering" },
      { x: 1400, y: 400, width: 100, height: 14 },
      { x: 1600, y: G, width: 400, height: 80 },
    ],
    checkpoints: [{ x: 50, y: G, activated: false }, { x: 800, y: 370, activated: false }, { x: 1600, y: G, activated: false }],
    objects: [
      { id: "l4-luz1", x: 550, y: 380, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 10, label: "Fragmento de luz" },
      { id: "l4-luz2", x: 900, y: 330, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 11, label: "Fragmento de luz" },
      { id: "l4-luz3", x: 1300, y: 430, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 12, label: "Fragmento de luz" },
    ],
    npcs: [{ id: "l4-reflection", x: 1650, y: G - 48, name: "Tu reflejo", dialogues: ["¿Me reconoces?", "Cada puerta que abriste, yo cerré otra.", "No puedes huir de mí. Yo soy tú."], currentDialogue: 0, type: "reflection", facingRight: false }],
    doors: [{ x: 1800, y: G - 80, width: 40, height: 80, locked: true, requiredObjects: ["l4-luz1", "l4-luz2", "l4-luz3"], leadsToLevel: 5 }],
    ambientParticles: { type: "stars", count: 40, color: "#E5DEC9" },
    bgLayers: [],
  },
  {
    id: 5, name: "LA VERDAD", backgroundColor: "#020005", groundY: G, exitX: 9999, levelWidth: 1600,
    platforms: [
      { x: 0, y: G, width: 1600, height: 80 },
      { x: 300, y: 420, width: 150, height: 14 },
      { x: 600, y: 380, width: 130, height: 14 },
      { x: 900, y: 400, width: 160, height: 14 },
    ],
    checkpoints: [{ x: 100, y: G, activated: false }, { x: 700, y: G, activated: false }],
    objects: [
      { id: "l5-pieza1", x: 400, y: 390, width: 25, height: 25, type: "light", collected: false, glowing: true, fragmentId: 13, label: "Pieza de identidad" },
      { id: "l5-pieza2", x: 700, y: 350, width: 25, height: 25, type: "light", collected: false, glowing: true, fragmentId: 14, label: "Pieza de identidad" },
      { id: "l5-pieza3", x: 1000, y: G - 30, width: 25, height: 25, type: "light", collected: false, glowing: true, fragmentId: 15, label: "Pieza de identidad" },
    ],
    npcs: [{ id: "l5-figure", x: 1300, y: G - 60, name: "La Verdad", dialogues: ["Has llegado al final.", "Cada objeto era un fragmento de ti.", "¿Puedes vivir con la verdad?"], currentDialogue: 0, type: "figure", facingRight: false }],
    doors: [],
    ambientParticles: { type: "dust", count: 25, color: "#B30000" },
    bgLayers: [{ speed: 0.05, elements: [{ x: 0, y: 100, w: 400, h: 420 }, { x: 600, y: 80, w: 500, h: 440 }] }],
  },
];
