export interface Fragment {
  id: number;
  text: string;
  choice_made: string;
  tone_score: number;
  tags: string[];
  traces: string[];
  storage_hash: string;
  tx_hash: string;
  timestamp: number;
}

export interface Choice {
  id: string;
  text: string;
  tone: "dark" | "light";
}

export interface GenerateRequest {
  scene: string;
  choice: string;
  history: Fragment[];
  fragment_id: number;
}

export interface GenerateResponse {
  fragment: Fragment;
  choices: Choice[];
}

export interface GameState {
  fragments: Fragment[];
  current_act: 1 | 2 | 3;
  current_scene: string;
  choices: Choice[];
  is_loading: boolean;
  is_complete: boolean;
}

export const INITIAL_SCENES = [
  {
    id: "alley",
    title: "El callejón",
    description: "Despiertas en un callejón oscuro. La lluvia golpea el asfalto. No sabes cómo llegaste aquí.",
  },
  {
    id: "office",
    title: "La oficina",
    description: "Un escritorio viejo. Una lámpara parpadea. Hay una foto boca abajo que no te atreves a voltear.",
  },
  {
    id: "train",
    title: "El tren",
    description: "El vagón está vacío. Afuera es de noche. No recuerdas haber comprado un boleto.",
  },
] as const;
