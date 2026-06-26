import type { Level } from "./gameTypes";

const GROUND = 500;

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "EL DESPERTAR",
    backgroundColor: "#050505",
    groundY: GROUND,
    exitX: 1800,
    platforms: [
      { x: 0, y: GROUND, width: 2000, height: 100 },
      { x: 200, y: 380, width: 160, height: 16 },
      { x: 500, y: 340, width: 200, height: 16 },
      { x: 900, y: 400, width: 140, height: 16 },
      { x: 1300, y: 360, width: 180, height: 16 },
    ],
    objects: [
      { id: "l1-maleta", x: 300, y: GROUND - 30, width: 40, height: 30, type: "item", collected: false, glowing: false, fragmentId: 1, label: "Maleta" },
      { id: "l1-espejo", x: 700, y: 300, width: 50, height: 70, type: "mirror", collected: false, glowing: false, fragmentId: 2, label: "Espejo roto" },
      { id: "l1-telefono", x: 1100, y: GROUND - 25, width: 30, height: 25, type: "phone", collected: false, glowing: false, fragmentId: 3, label: "Teléfono" },
    ],
    npcs: [
      { id: "l1-hooded", x: 1500, y: GROUND - 48, name: "???", dialogues: [
        "No deberías estar despierto.",
        "El que duerme no recuerda. Y el que recuerda no duerme.",
        "Busca la maleta. Busca el espejo. Busca la verdad.",
      ], currentDialogue: 0, type: "hooded", facingRight: false },
    ],
    doors: [
      { x: 1800, y: GROUND - 80, width: 40, height: 80, locked: true, requiredObjects: ["l1-maleta", "l1-espejo", "l1-telefono"], leadsToLevel: 2 },
    ],
    ambientParticles: { type: "ash", count: 30, color: "#8C8275" },
    bgLayers: [
      { speed: 0.1, elements: [
        { x: 0, y: 200, w: 80, h: 300 }, { x: 200, y: 250, w: 60, h: 250 }, { x: 400, y: 180, w: 100, h: 320 },
        { x: 700, y: 220, w: 70, h: 280 }, { x: 1000, y: 190, w: 90, h: 310 }, { x: 1400, y: 240, w: 80, h: 260 },
      ]},
      { speed: 0.3, elements: [
        { x: 100, y: 300, w: 40, h: 200, lit: true }, { x: 500, y: 280, w: 50, h: 220, lit: true },
        { x: 800, y: 320, w: 35, h: 180 }, { x: 1200, y: 290, w: 45, h: 210, lit: true },
      ]},
    ],
  },
  {
    id: 2,
    name: "LA CIUDAD",
    backgroundColor: "#030308",
    groundY: GROUND,
    exitX: 2000,
    platforms: [
      { x: 0, y: GROUND, width: 2200, height: 100 },
      { x: 150, y: 420, width: 120, height: 20 },
      { x: 400, y: 360, width: 100, height: 16 },
      { x: 600, y: 300, width: 100, height: 16 },
      { x: 800, y: 360, width: 120, height: 16 },
      { x: 1100, y: 320, width: 150, height: 16 },
      { x: 1500, y: 380, width: 100, height: 16 },
    ],
    objects: [
      { id: "l2-periodico", x: 250, y: GROUND - 15, width: 35, height: 15, type: "document", collected: false, glowing: false, fragmentId: 4, label: "Periódico" },
      { id: "l2-camara", x: 750, y: 260, width: 30, height: 30, type: "computer", collected: false, glowing: false, fragmentId: 5, label: "Cámara de seguridad" },
      { id: "l2-cartera", x: 1300, y: GROUND - 20, width: 30, height: 20, type: "item", collected: false, glowing: false, fragmentId: 6, label: "Cartera perdida" },
    ],
    npcs: [
      { id: "l2-vagrant", x: 500, y: GROUND - 40, name: "Vagabundo", dialogues: [
        "Yo te conozco. O te conocía.",
        "Antes venías por aquí todas las noches. Siempre solo.",
        "La última vez que te vi... tenías sangre en las manos.",
      ], currentDialogue: 0, type: "vagrant", facingRight: true },
    ],
    doors: [
      { x: 2000, y: GROUND - 80, width: 40, height: 80, locked: true, requiredObjects: ["l2-periodico", "l2-camara", "l2-cartera"], leadsToLevel: 3 },
    ],
    ambientParticles: { type: "rain", count: 60, color: "#4060a0" },
    bgLayers: [
      { speed: 0.1, elements: [
        { x: 0, y: 150, w: 120, h: 350 }, { x: 300, y: 180, w: 80, h: 320 }, { x: 600, y: 130, w: 100, h: 370 },
        { x: 900, y: 160, w: 90, h: 340 }, { x: 1200, y: 140, w: 110, h: 360 }, { x: 1600, y: 170, w: 85, h: 330 },
      ]},
      { speed: 0.3, elements: [
        { x: 150, y: 250, w: 50, h: 250, lit: true }, { x: 450, y: 270, w: 40, h: 230, lit: true },
        { x: 750, y: 240, w: 55, h: 260, lit: true }, { x: 1100, y: 260, w: 45, h: 240 },
      ]},
    ],
  },
  {
    id: 3,
    name: "LOS DOCUMENTOS",
    backgroundColor: "#050502",
    groundY: GROUND,
    exitX: 1600,
    platforms: [
      { x: 0, y: GROUND, width: 1800, height: 100 },
      { x: 200, y: 400, width: 200, height: 20 },
      { x: 500, y: 350, width: 180, height: 20 },
      { x: 800, y: 380, width: 160, height: 20 },
      { x: 1100, y: 340, width: 200, height: 20 },
    ],
    objects: [
      { id: "l3-expediente", x: 350, y: 370, width: 40, height: 25, type: "document", collected: false, glowing: false, fragmentId: 7, label: "Expediente" },
      { id: "l3-computadora", x: 680, y: 320, width: 45, height: 35, type: "computer", collected: false, glowing: false, fragmentId: 8, label: "Computadora encendida" },
      { id: "l3-foto", x: 1000, y: GROUND - 40, width: 35, height: 45, type: "photo", collected: false, glowing: false, fragmentId: 9, label: "Foto enmarcada" },
    ],
    npcs: [
      { id: "l3-secretary", x: 1200, y: GROUND - 48, name: "Secretaria", dialogues: [
        "No hay cita programada hoy.",
        "...ese nombre no aparece en el sistema. Ya no.",
        "Vete antes de que regrese. Él sabe que estás aquí.",
      ], currentDialogue: 0, type: "secretary", facingRight: false },
    ],
    doors: [
      { x: 1600, y: GROUND - 80, width: 40, height: 80, locked: true, requiredObjects: ["l3-expediente", "l3-computadora", "l3-foto"], leadsToLevel: 4 },
    ],
    ambientParticles: { type: "paper", count: 15, color: "#E5DEC9" },
    bgLayers: [
      { speed: 0.1, elements: [
        { x: 0, y: 200, w: 300, h: 300 }, { x: 500, y: 200, w: 300, h: 300 }, { x: 1000, y: 200, w: 300, h: 300 },
      ]},
      { speed: 0.3, elements: [
        { x: 100, y: 280, w: 60, h: 220, lit: true }, { x: 400, y: 300, w: 50, h: 200, lit: true },
      ]},
    ],
  },
  {
    id: 4,
    name: "EL VACÍO",
    backgroundColor: "#000000",
    groundY: GROUND,
    exitX: 1800,
    platforms: [
      { x: 0, y: GROUND, width: 300, height: 100 },
      { x: 400, y: 450, width: 120, height: 16, type: "flickering" },
      { x: 600, y: 400, width: 100, height: 16, type: "flickering" },
      { x: 800, y: 350, width: 120, height: 16, type: "flickering" },
      { x: 1000, y: 400, width: 100, height: 16, type: "flickering" },
      { x: 1200, y: 450, width: 120, height: 16, type: "flickering" },
      { x: 1400, y: 380, width: 100, height: 16 },
      { x: 1600, y: GROUND, width: 400, height: 100 },
    ],
    objects: [
      { id: "l4-luz1", x: 550, y: 360, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 10, label: "Fragmento de luz" },
      { id: "l4-luz2", x: 900, y: 310, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 11, label: "Fragmento de luz" },
      { id: "l4-luz3", x: 1300, y: 410, width: 20, height: 20, type: "light", collected: false, glowing: true, fragmentId: 12, label: "Fragmento de luz" },
    ],
    npcs: [
      { id: "l4-reflection", x: 1500, y: GROUND - 48, name: "Tu reflejo", dialogues: [
        "¿Me reconoces? Soy lo que dejaste atrás.",
        "Cada puerta que abriste, yo cerré otra.",
        "No puedes huir de mí. Yo soy tú.",
      ], currentDialogue: 0, type: "reflection", facingRight: false },
    ],
    doors: [
      { x: 1800, y: GROUND - 80, width: 40, height: 80, locked: true, requiredObjects: ["l4-luz1", "l4-luz2", "l4-luz3"], leadsToLevel: 5 },
    ],
    ambientParticles: { type: "stars", count: 40, color: "#E5DEC9" },
    bgLayers: [],
  },
  {
    id: 5,
    name: "LA VERDAD",
    backgroundColor: "#020005",
    groundY: GROUND,
    exitX: 9999,
    platforms: [
      { x: 0, y: GROUND, width: 1600, height: 100 },
      { x: 300, y: 400, width: 150, height: 16 },
      { x: 600, y: 360, width: 130, height: 16 },
      { x: 900, y: 380, width: 160, height: 16 },
    ],
    objects: [
      { id: "l5-pieza1", x: 400, y: 370, width: 25, height: 25, type: "light", collected: false, glowing: true, fragmentId: 13, label: "Pieza de identidad" },
      { id: "l5-pieza2", x: 700, y: 330, width: 25, height: 25, type: "light", collected: false, glowing: true, fragmentId: 14, label: "Pieza de identidad" },
      { id: "l5-pieza3", x: 1000, y: GROUND - 30, width: 25, height: 25, type: "light", collected: false, glowing: true, fragmentId: 15, label: "Pieza de identidad" },
    ],
    npcs: [
      { id: "l5-figure", x: 1300, y: GROUND - 60, name: "La Verdad", dialogues: [
        "Has llegado al final. O al principio.",
        "Cada objeto que recogiste era un fragmento de ti.",
        "Ahora sabes quién eres. La pregunta es: ¿puedes vivir con eso?",
      ], currentDialogue: 0, type: "figure", facingRight: false },
    ],
    doors: [],
    ambientParticles: { type: "dust", count: 25, color: "#B30000" },
    bgLayers: [
      { speed: 0.05, elements: [
        { x: 0, y: 100, w: 400, h: 400 }, { x: 600, y: 80, w: 500, h: 420 },
      ]},
    ],
  },
];
