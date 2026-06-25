import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeResponse, Fragment, PlayerProfile } from "./types";
import { buildPlayerProfile } from "./types";

// ─── Fallback fragments for when API is unavailable ───
const FALLBACK_FRAGMENTS: Record<number, ClaudeResponse> = {
  1: {
    fragment_text: "Los ojos se abren. No hay techo, solo oscuridad líquida que gotea hacia adentro. Mis manos no son mías — demasiado limpias para lo que siento por dentro. Hay un olor: tabaco viejo, tinta fresca, algo metálico que no quiero nombrar. Una maleta abierta. Ropa que no reconozco pero que huele a mí. En el bolsillo del abrigo, una nota doblada tres veces: 'No confíes en lo que recuerdes primero.' La letra es mía. ¿Por qué me advertiría a mí mismo?",
    tone_score: 6,
    tags: ["identidad", "confusión", "advertencia"],
    traces: ["nota doblada tres veces", "olor a tinta fresca"],
  },
  2: {
    fragment_text: "El pasillo se estira como una garganta. Cada puerta cerrada guarda un eco que no puedo descifrar. Camino sin saber hacia dónde, pero mis pies conocen el camino — músculo memoria de noches que mi mente borró. Un espejo roto al final del corredor. En cada fragmento veo un rostro distinto: uno sonríe, otro llora, el tercero mira con una calma que hiela. ¿Cuál de ellos soy? El cristal cruje bajo mis zapatos. Alguien estuvo aquí antes que yo. O fui yo, en otra vida.",
    tone_score: 7,
    tags: ["espejo", "identidad fragmentada", "memoria corporal"],
    traces: ["espejo roto en el corredor", "tres rostros distintos"],
  },
  3: {
    fragment_text: "Hay una fotografía en el suelo. Boca abajo, como si alguien la hubiera dejado caer con prisa. La levanto: dos figuras en un muelle, atardecer cobrizo, una de ellas soy yo. La otra tiene el rostro borrado — no por el tiempo, sino con intención. Alguien raspó la emulsión con una moneda o una uña. Mi sonrisa en la foto es auténtica. Eso es lo que más me perturba. ¿Cómo puedo sonreír así junto a alguien cuyo rostro necesitó ser destruido?",
    tone_score: 8,
    tags: ["fotografía", "relación borrada", "culpa"],
    traces: ["fotografía del muelle", "rostro borrado deliberadamente"],
  },
  4: {
    fragment_text: "El teléfono suena. Lo tomo sin pensar — el gesto es automático, un reflejo que sobrevivió al olvido. Silencio al otro lado. No, no silencio: respiración contenida, el tipo de respiración de quien quiere ser escuchado sin hablar. Dejo que el tiempo se espese entre nosotros. Luego, una sola palabra, susurrada con la urgencia de quien sabe que la línea no es segura: mi nombre. Un nombre que no reconozco. Pero mi corazón se acelera como si lo hubiera esperado toda la vida.",
    tone_score: 7,
    tags: ["teléfono", "nombre desconocido", "reconocimiento"],
    traces: ["llamada anónima", "nombre susurrado"],
  },
  5: {
    fragment_text: "Bajo las escaleras hacia el sótano. No porque quiera — porque algo en mí sabe que es necesario. El aire cambia: más frío, más honesto. Las paredes de concreto guardan marcas de conteo. Alguien estuvo encerrado aquí. Los trazos son regulares, disciplinados — no desesperación sino rutina. Cuento: trescientos doce días. En la esquina, grabado con algo afilado, un mapa. Calles que conozco. Un punto marcado con una X y una fecha. La fecha es mañana.",
    tone_score: 9,
    tags: ["sótano", "cautiverio", "mapa oculto"],
    traces: ["312 días de cautiverio", "mapa grabado con fecha de mañana"],
  },
};

function getFallbackFragment(fragmentId: number, choice: string): ClaudeResponse {
  const base = FALLBACK_FRAGMENTS[Math.min(fragmentId, 5)] || FALLBACK_FRAGMENTS[1];
  return {
    ...base,
    tone_score: base.tone_score + Math.floor(Math.random() * 3 - 1),
    tags: [...base.tags, fragmentId > 5 ? "acto-ii" : "acto-i"],
  };
}

// ─── Prompt builders ───

function getActInstructions(fragmentId: number): string {
  if (fragmentId <= 5) {
    return `RITMO — ACTO I: Lento, confuso, desorientado. Frases fragmentadas. Mucho sensorial.`;
  }
  if (fragmentId <= 12) {
    return `RITMO — ACTO II: Tenso, urgente, frases que aceleran. Contradicciones con fragmentos anteriores.`;
  }
  return `RITMO — ACTO III: Claridad terrible. Frases directas. Conecta con fragmentos anteriores.`;
}

function getProfileContext(profile: PlayerProfile): string {
  if (profile.tendency === "shadow") {
    return `PERFIL: Tendencia SOMBRA (${profile.darkChoices} oscuras vs ${profile.lightChoices} luz). Intensifica el tono oscuro.`;
  }
  if (profile.tendency === "light") {
    return `PERFIL: Tendencia LUZ (${profile.lightChoices} luz vs ${profile.darkChoices} oscuras). Refleja remordimiento constructivo.`;
  }
  return `PERFIL: EQUILIBRADO (${profile.darkChoices} oscuras, ${profile.lightChoices} luz). Los recuerdos deben ser ambiguos.`;
}

const SYSTEM_PROMPT_BASE = `Eres el narrador de Mongli Game, un juego noir de amnesia psicológica.
Escribe en primera persona (sin nombre). Tono: oscuro, poético, perturbador. Frases cortas.
80-120 palabras exactas. La ÚLTIMA FRASE debe crear suspenso.
Responde SOLO en JSON: { "fragment_text": "...", "tone_score": 0-10, "tags": ["..."], "traces": ["..."] }`;

function tryParseJSON(text: string): ClaudeResponse | null {
  try { return JSON.parse(text) as ClaudeResponse; } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]) as ClaudeResponse; } catch { /* */ } }
  return null;
}

export async function generateFragment(
  scene: string,
  history: Fragment[],
  choice: string
): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no API key or it's empty, use fallback
  if (!apiKey || apiKey === "sk-ant-..." || apiKey.length < 20) {
    console.log("[Claude] No valid API key — using demo mode");
    return getFallbackFragment(history.length + 1, choice);
  }

  const client = new Anthropic({ apiKey });
  const profile = buildPlayerProfile(history);
  const fragmentId = history.length + 1;

  const systemPrompt = `${SYSTEM_PROMPT_BASE}\n${getActInstructions(fragmentId)}\n${getProfileContext(profile)}`;

  const historyContext = history.length > 0
    ? history.slice(-3).map((f) => `[#${f.id} tono:${f.toneScore}]: ${f.text}`).join("\n")
    : "Sin historial — primer recuerdo.";

  const userMessage = `CONTEXTO:\n${historyContext}\n\nEscena: ${scene}\nDecisión: ${choice || "Inicio"}\nFragmento ${fragmentId}/15.`;

  // Try multiple models in order of preference
  const MODELS = [
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-20241022",
    "claude-3-haiku-20240307",
  ];

  for (const model of MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const response = await client.messages.create(
        { model, max_tokens: 400, system: systemPrompt, messages: [{ role: "user", content: userMessage }] },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = tryParseJSON(text);
      if (parsed?.fragment_text) {
        console.log(`[Claude] Success with model: ${model}`);
        return {
          fragment_text: parsed.fragment_text,
          tone_score: Math.min(10, Math.max(0, parsed.tone_score ?? 5)),
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          traces: Array.isArray(parsed.traces) ? parsed.traces : [],
        };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Claude] Model ${model} failed: ${msg.slice(0, 80)}`);
      // If it's a 404 (model not found), try next model
      if (msg.includes("404") || msg.includes("not_found")) continue;
      // For other errors (timeout, rate limit), also try next
      continue;
    }
  }

  // All models failed — use fallback
  console.log("[Claude] All models failed — using demo fallback");
  return getFallbackFragment(fragmentId, choice);
}
