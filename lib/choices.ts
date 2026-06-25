import type { Choice, Fragment, PlayerProfile } from "./types";
import { buildPlayerProfile } from "./types";

interface ChoiceDefinition {
  id: string;
  textBase: string;
  textResonance?: string;
  tone: "dark" | "light";
  narrativeConsequence: string;
  profileEffect: { darknessShift: number; tag?: string };
  isPointOfNoReturn?: boolean;
}

const ACT_1_CHOICES: [ChoiceDefinition, ChoiceDefinition][] = [
  [
    {
      id: "guilt",
      textBase: "Recordar con culpa — dejar que el peso aplaste",
      tone: "dark",
      narrativeConsequence: "El siguiente recuerdo emerge teñido de arrepentimiento",
      profileEffect: { darknessShift: 1, tag: "culpa" },
    },
    {
      id: "relief",
      textBase: "Recordar con alivio — soltar lo que fue",
      textResonance: "Soltar el peso — quizás la paz existe, quizás no la mereces",
      tone: "light",
      narrativeConsequence: "Un respiro breve antes de la siguiente tormenta",
      profileEffect: { darknessShift: -1, tag: "alivio" },
    },
  ],
  [
    {
      id: "advance",
      textBase: "Avanzar hacia la sombra — enfrentar lo que hay",
      tone: "dark",
      narrativeConsequence: "La oscuridad revela un detalle que preferirías no haber visto",
      profileEffect: { darknessShift: 1, tag: "confrontación" },
    },
    {
      id: "flee",
      textBase: "Huir del recuerdo — cerrar esa puerta",
      textResonance: "Cerrar la puerta — pero algo del otro lado golpea suavemente",
      tone: "light",
      narrativeConsequence: "El recuerdo evitado dejará un eco en los siguientes fragmentos",
      profileEffect: { darknessShift: -1, tag: "evasión" },
    },
  ],
  [
    {
      id: "dig",
      textBase: "Cavar más profundo — hay algo debajo",
      tone: "dark",
      narrativeConsequence: "Desenterrar lo que debería haber quedado sepultado",
      profileEffect: { darknessShift: 1, tag: "obsesión" },
    },
    {
      id: "surface",
      textBase: "Quedarse en la superficie — mejor no saber",
      textResonance: "Quedarse en la superficie — aunque la curiosidad te corroe por dentro",
      tone: "light",
      narrativeConsequence: "La ignorancia protege, pero los indicios se acumulan",
      profileEffect: { darknessShift: -1, tag: "protección" },
    },
  ],
  [
    {
      id: "touch",
      textBase: "Tocar la herida — sentir si es real",
      tone: "dark",
      narrativeConsequence: "El dolor confirma algo que el placer jamás podría",
      profileEffect: { darknessShift: 1, tag: "dolor" },
    },
    {
      id: "ignore",
      textBase: "Ignorar la marca — no todo importa",
      textResonance: "Ignorar la marca — aunque late como un segundo corazón",
      tone: "light",
      narrativeConsequence: "Lo que ignoras crece en los márgenes de la percepción",
      profileEffect: { darknessShift: -1, tag: "negación" },
    },
  ],
  [
    {
      id: "follow_voice",
      textBase: "Seguir la voz — alguien me conoce",
      tone: "dark",
      narrativeConsequence: "La voz te lleva a un lugar que tu cuerpo recuerda pero tu mente no",
      profileEffect: { darknessShift: 1, tag: "obediencia" },
    },
    {
      id: "silence",
      textBase: "Buscar el silencio — la voz miente",
      textResonance: "Buscar el silencio — pero el silencio también tiene una voz",
      tone: "light",
      narrativeConsequence: "En el silencio emergen los recuerdos que el ruido ocultaba",
      profileEffect: { darknessShift: -1, tag: "independencia" },
    },
  ],
];

// Act II: morally ambiguous — both choices have darkness
const ACT_2_CHOICES: [ChoiceDefinition, ChoiceDefinition][] = [
  [
    {
      id: "suspect",
      textBase: "Sospechar de todo — si nada es real, nada puede herirte",
      tone: "dark",
      narrativeConsequence: "La desconfianza aísla, pero la soledad protege",
      profileEffect: { darknessShift: 1, tag: "paranoia" },
    },
    {
      id: "trust",
      textBase: "Confiar en la visión — aunque la confianza tenga precio",
      textResonance: "Entregarte a la visión — quizás la verdad duela más que la mentira",
      tone: "light",
      narrativeConsequence: "La confianza abre puertas que tal vez debían quedarse cerradas",
      profileEffect: { darknessShift: 0, tag: "fe-ciega" },
    },
  ],
  [
    {
      id: "confront",
      textBase: "Confrontar al reflejo — si eres tú, necesitas saberlo",
      tone: "dark",
      narrativeConsequence: "El reflejo muestra algo que las palabras no pueden describir",
      profileEffect: { darknessShift: 1, tag: "verdad" },
    },
    {
      id: "deny",
      textBase: "Apartar la vista — la verdad puede esperar un turno más",
      textResonance: "Apartar la vista — pero el reflejo sigue mirándote a ti",
      tone: "light",
      narrativeConsequence: "Lo negado no desaparece: muta y crece en la periferia",
      profileEffect: { darknessShift: 0, tag: "evasión-consciente" },
    },
  ],
  [
    {
      id: "accuse",
      textBase: "Acusar — alguien tiene que pagar por esto",
      tone: "dark",
      narrativeConsequence: "Señalar culpables es fácil; saber si aciertas es otro asunto",
      profileEffect: { darknessShift: 2, tag: "ira" },
      isPointOfNoReturn: true,
    },
    {
      id: "forgive",
      textBase: "Perdonar — no porque lo merezcan, sino porque tú lo necesitas",
      textResonance: "Perdonar — aunque el perdón se sienta como rendición",
      tone: "light",
      narrativeConsequence: "El perdón libera, pero deja un vacío donde estaba la ira",
      profileEffect: { darknessShift: -1, tag: "perdón" },
    },
  ],
  [
    {
      id: "burn_bridges",
      textBase: "Quemar los puentes — lo que fue, fue",
      tone: "dark",
      narrativeConsequence: "Las cenizas no mienten: muestran lo que el fuego consumió",
      profileEffect: { darknessShift: 2, tag: "destrucción" },
      isPointOfNoReturn: true,
    },
    {
      id: "rebuild",
      textBase: "Reconstruir con las ruinas — algo nuevo puede nacer de esto",
      textResonance: "Reconstruir — aunque cada pieza que colocas revela otra que falta",
      tone: "light",
      narrativeConsequence: "Reconstruir es admitir que algo se rompió, y eso tiene su propia verdad",
      profileEffect: { darknessShift: -1, tag: "resiliencia" },
    },
  ],
  [
    {
      id: "consume",
      textBase: "Dejar que la oscuridad hable — tiene algo que decir",
      tone: "dark",
      narrativeConsequence: "Lo que la oscuridad dice no puede des-escucharse",
      profileEffect: { darknessShift: 2, tag: "rendición" },
      isPointOfNoReturn: true,
    },
    {
      id: "resist",
      textBase: "Resistir la corriente — aunque no sepas hacia dónde nadas",
      textResonance: "Resistir — pero la corriente sabe cosas que tú no",
      tone: "light",
      narrativeConsequence: "Resistir cansa, y el cansancio trae una lucidez amarga",
      profileEffect: { darknessShift: 0, tag: "voluntad" },
    },
  ],
  [
    {
      id: "become_fear",
      textBase: "Convertirte en lo que temen — si van a temerte, que sea con razón",
      tone: "dark",
      narrativeConsequence: "El miedo que inspiras es un espejo de lo que eres",
      profileEffect: { darknessShift: 2, tag: "poder" },
      isPointOfNoReturn: true,
    },
    {
      id: "protect",
      textBase: "Proteger lo que queda — aunque no sepas exactamente qué es",
      textResonance: "Proteger lo que queda — incluso si eso te incluye a ti como amenaza",
      tone: "light",
      narrativeConsequence: "Proteger exige saber qué vale la pena, y esa respuesta cambia",
      profileEffect: { darknessShift: 0, tag: "sacrificio" },
    },
  ],
  [
    {
      id: "remember_pain",
      textBase: "Elegir el dolor del recuerdo — al menos el dolor es honesto",
      tone: "dark",
      narrativeConsequence: "El dolor abre recuerdos que el confort mantenía sellados",
      profileEffect: { darknessShift: 1, tag: "masoquismo" },
    },
    {
      id: "remember_peace",
      textBase: "Buscar la paz entre los fragmentos — tiene que haberla en algún lugar",
      textResonance: "Buscar paz — aunque cada fragmento de paz revela más guerra alrededor",
      tone: "light",
      narrativeConsequence: "La paz encontrada entre fragmentos es frágil y provisional",
      profileEffect: { darknessShift: -1, tag: "esperanza" },
    },
  ],
];

const ACT_3_CHOICES: [ChoiceDefinition, ChoiceDefinition][] = [
  [
    {
      id: "accept_architect",
      textBase: "Aceptar la verdad — yo construí esto. Todo esto.",
      tone: "dark",
      narrativeConsequence: "La identidad del Arquitecto se solidifica irrevocablemente",
      profileEffect: { darknessShift: 3, tag: "identidad-oscura" },
      isPointOfNoReturn: true,
    },
    {
      id: "accept_witness",
      textBase: "Aceptar ser testigo — no elegí esto, pero lo vi todo",
      textResonance: "Aceptar ser testigo — aunque ver y no actuar tiene su propia culpa",
      tone: "light",
      narrativeConsequence: "La identidad del Testigo se solidifica con su carga de pasividad",
      profileEffect: { darknessShift: -2, tag: "identidad-clara" },
    },
  ],
  [
    {
      id: "embrace_whole",
      textBase: "Abrazar la identidad completa — luz y sombra son la misma cosa",
      tone: "dark",
      narrativeConsequence: "La dualidad se fusiona en una verdad que no es ni buena ni mala",
      profileEffect: { darknessShift: 0, tag: "dualidad" },
    },
    {
      id: "rewrite",
      textBase: "Reescribir — el pasado es fijo, pero el futuro no tiene por qué serlo",
      textResonance: "Reescribir la historia — aunque la tinta original sangra por debajo",
      tone: "light",
      narrativeConsequence: "Reescribir es un acto de fe en un futuro que aún no existe",
      profileEffect: { darknessShift: -1, tag: "redención" },
    },
  ],
  [
    {
      id: "close_eyes",
      textBase: "Cerrar los ojos por última vez — la oscuridad ya no asusta",
      tone: "dark",
      narrativeConsequence: "El cierre final: la oscuridad se convierte en hogar",
      profileEffect: { darknessShift: 2, tag: "fin-oscuro" },
    },
    {
      id: "open_eyes",
      textBase: "Abrir los ojos — despertar sabiendo quién eres, por fin",
      textResonance: "Abrir los ojos — sabiendo que lo que verás no puede des-verse",
      tone: "light",
      narrativeConsequence: "El despertar final: la luz revela todo, incluso lo que preferirías no ver",
      profileEffect: { darknessShift: -2, tag: "despertar" },
    },
  ],
];

function applyResonance(def: ChoiceDefinition, profile: PlayerProfile): Choice {
  const isCounterToTendency =
    (profile.tendency === "shadow" && def.tone === "light") ||
    (profile.tendency === "light" && def.tone === "dark");

  // Resonance: if the player has been consistently choosing one side,
  // the opposite choices become more tempting with alternative text
  const useResonanceText =
    isCounterToTendency &&
    def.textResonance &&
    Math.abs(profile.ratio - 0.5) > 0.2;

  return {
    id: def.id,
    text: useResonanceText ? def.textResonance! : def.textBase,
    tone: def.tone,
    narrativeConsequence: def.narrativeConsequence,
    profileEffect: def.profileEffect,
    isPointOfNoReturn: def.isPointOfNoReturn,
  };
}

export function getChoicesForFragment(
  fragmentId: number,
  history: Fragment[] = []
): [Choice, Choice] {
  const act = fragmentId <= 5 ? 1 : fragmentId <= 12 ? 2 : 3;
  const profile = buildPlayerProfile(history);

  let pool: [ChoiceDefinition, ChoiceDefinition][];
  if (act === 1) pool = ACT_1_CHOICES;
  else if (act === 2) pool = ACT_2_CHOICES;
  else pool = ACT_3_CHOICES;

  const index = (fragmentId - 1) % pool.length;
  const pair = pool[index];

  return [
    applyResonance(pair[0], profile),
    applyResonance(pair[1], profile),
  ];
}
