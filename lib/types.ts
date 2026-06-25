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

export function buildPlayerProfile(fragments: Fragment[]): PlayerProfile {
  let darkChoices = 0;
  let lightChoices = 0;
  const pointsOfNoReturn: string[] = [];

  for (const f of fragments) {
    const choice = f.choiceMade.toLowerCase();
    const isDark =
      choice.includes("culpa") ||
      choice.includes("sospech") ||
      choice.includes("sombra") ||
      choice.includes("cavar") ||
      choice.includes("oscur") ||
      choice.includes("confrontar") ||
      choice.includes("acusar") ||
      choice.includes("quemar") ||
      choice.includes("consum") ||
      choice.includes("convertir") ||
      choice.includes("aceptar la verdad oscura") ||
      choice.includes("cerrar los ojos");

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
