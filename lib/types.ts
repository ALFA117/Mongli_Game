// ─── Core fragment (unchanged for backwards compatibility) ───
export interface Fragment {
  id: number;
  text: string;
  toneScore: number;
  tags: string[];
  traces: string[];
  choiceMade: string;
  storageHash?: string;
  txHash?: string;
  timestamp: number;
  unlocked: boolean;
}

// ─── Act system (new 5-act structure) ───
export type SkullScene = "hotel" | "alley" | "office" | "void" | "archive";

export interface ActDefinition {
  id: number;
  title: string;
  subtitle: string;
  scene: SkullScene;
  sceneDescription: string;
  decision: {
    dark: { id: string; text: string; consequence: string };
    light: { id: string; text: string; consequence: string };
  };
}

export interface ActRecord {
  actId: number;
  fragments: Fragment[];
  decision: string;
  storageHash?: string;
  txHash?: string;
  timestamp: number;
  toneAverage: number;
}

export const ACTS: ActDefinition[] = [
  {
    id: 1,
    title: "El Despertar",
    subtitle: "¿Quién eres? ¿Dónde estás?",
    scene: "hotel",
    sceneDescription: "Una habitación polvorienta. Una maleta abierta con ropa que no reconoces. El aire huele a tabaco y tinta.",
    decision: {
      dark: { id: "open_door", text: "Abres la puerta — enfrentar lo que hay afuera", consequence: "La oscuridad del pasillo te traga" },
      light: { id: "wait_silence", text: "Esperas en silencio — escuchas antes de actuar", consequence: "El silencio revela sonidos que preferirías no oír" },
    },
  },
  {
    id: 2,
    title: "La Ciudad",
    subtitle: "Las calles recuerdan lo que tú olvidaste",
    scene: "alley",
    sceneDescription: "Lluvia. Un letrero de neón parpadea. Hay sangre en tu camisa y un extraño te observa desde la esquina.",
    decision: {
      dark: { id: "follow_stranger", text: "Sigues al extraño — alguien te conoce", consequence: "Te lleva a un lugar que tu cuerpo recuerda" },
      light: { id: "take_other_route", text: "Tomas otra ruta — no confías en nadie", consequence: "El desvío te lleva a algo que no esperabas" },
    },
  },
  {
    id: 3,
    title: "Los Documentos",
    subtitle: "La verdad está escrita en algún lugar",
    scene: "office",
    sceneDescription: "Un escritorio con fotos boca abajo. El teléfono suena sin parar. Hay un archivo con tu nombre — o lo que crees que es tu nombre.",
    decision: {
      dark: { id: "burn_documents", text: "Quemas los documentos — lo que no existe no puede herirte", consequence: "Las cenizas guardan la forma de lo que destruiste" },
      light: { id: "take_documents", text: "Te los llevas — la verdad merece existir", consequence: "Cada página que lees reescribe lo que creías saber" },
    },
  },
  {
    id: 4,
    title: "El Vacío",
    subtitle: "Entre la memoria y el olvido",
    scene: "void",
    sceneDescription: "No hay paredes. No hay suelo. Solo la oscuridad y los fragmentos de lo que fuiste flotando como constelaciones rotas.",
    decision: {
      dark: { id: "remember_all", text: "Recuerdas todo — aunque duela, aunque destruya", consequence: "La memoria completa es un arma de doble filo" },
      light: { id: "choose_forget", text: "Prefieres olvidar — la piedad es un derecho", consequence: "El olvido voluntario tiene su propio precio" },
    },
  },
  {
    id: 5,
    title: "La Revelación",
    subtitle: "La verdad no se descubre. Se recuerda.",
    scene: "archive",
    sceneDescription: "Todos los fragmentos convergen. Todas las decisiones pesan. Es hora de saber quién eres — o quién fuiste.",
    decision: {
      dark: { id: "final", text: "", consequence: "" },
      light: { id: "final", text: "", consequence: "" },
    },
  },
];

// ─── Choices ───
export interface Choice {
  id: string;
  text: string;
  tone: "dark" | "light";
  narrativeConsequence?: string;
  profileEffect?: ProfileEffect;
  isPointOfNoReturn?: boolean;
}

export interface ProfileEffect {
  darknessShift: number;
  tag?: string;
}

export interface PlayerProfile {
  darkChoices: number;
  lightChoices: number;
  ratio: number;
  tendency: "shadow" | "light" | "balanced";
  pointsOfNoReturn: string[];
}

// ─── API types ───
export interface GameState {
  currentScene: string;
  fragments: Fragment[];
  currentFragmentId: number;
  choices: Choice[];
  isGenerating: boolean;
  act: 1 | 2 | 3;
}

export interface GenerateRequest {
  scene: string;
  history: Fragment[];
  choice: string;
  fragmentId: number;
}

export interface GenerateResponse {
  fragment: Fragment;
  choices: Choice[];
  storageHash: string;
  txHash: string;
}

export interface ClaudeResponse {
  fragment_text: string;
  tone_score: number;
  tags: string[];
  traces: string[];
}

// ─── Profile builder ───
export function buildPlayerProfile(fragments: Fragment[]): PlayerProfile {
  let darkChoices = 0;
  let lightChoices = 0;
  const pointsOfNoReturn: string[] = [];

  for (const f of fragments) {
    const choice = f.choiceMade.toLowerCase();
    const isDark =
      choice.includes("culpa") || choice.includes("sospech") ||
      choice.includes("sombra") || choice.includes("cavar") ||
      choice.includes("oscur") || choice.includes("confrontar") ||
      choice.includes("acusar") || choice.includes("quemar") ||
      choice.includes("consum") || choice.includes("convertir") ||
      choice.includes("abres la puerta") || choice.includes("sigues al extraño") ||
      choice.includes("quemas los documentos") || choice.includes("recuerdas todo");

    if (isDark) darkChoices++;
    else if (f.choiceMade) lightChoices++;
  }

  const total = darkChoices + lightChoices;
  const ratio = total > 0 ? darkChoices / total : 0.5;
  const tendency: "shadow" | "light" | "balanced" =
    ratio > 0.6 ? "shadow" : ratio < 0.4 ? "light" : "balanced";

  return { darkChoices, lightChoices, ratio, tendency, pointsOfNoReturn };
}

export const INITIAL_SCENES = [
  {
    id: "hotel",
    title: "Hotel abandonado",
    description: "Una habitación polvorienta. Una maleta abierta con ropa que no reconoces.",
    icon: "🏚️",
  },
  {
    id: "callejon",
    title: "Callejón oscuro",
    description: "Lluvia. Un letrero de neón parpadea. Hay sangre en tu camisa.",
    icon: "🌧️",
  },
  {
    id: "oficina",
    title: "Oficina cerrada",
    description: "Un escritorio con fotos boca abajo. El teléfono suena sin parar.",
    icon: "📞",
  },
] as const;
