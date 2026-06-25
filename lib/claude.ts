import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeResponse, Fragment, PlayerProfile } from "./types";
import { buildPlayerProfile } from "./types";

function getActInstructions(fragmentId: number): string {
  if (fragmentId <= 5) {
    return `RITMO NARRATIVO — ACTO I (Identidad Desconocida):
Escribe lento, confuso, desorientado. El personaje apenas percibe su entorno. Las frases deben ser fragmentadas, como pensamientos que se disuelven antes de completarse. Usa mucho sensorial: olores, texturas, sonidos distorsionados. No des pistas claras de identidad — solo impresiones vagas y perturbadoras.`;
  }
  if (fragmentId <= 12) {
    return `RITMO NARRATIVO — ACTO II (Dos Caminos):
Escribe tenso, urgente, con frases que aceleran. Dos identidades posibles emergen: ¿fue el personaje héroe o villano? Introduce contradicciones deliberadas con fragmentos anteriores. Momentos de lucidez mezclados con confusión. El tono debe oscilar entre miedo y determinación.`;
  }
  return `RITMO NARRATIVO — ACTO III (La Revelación):
Escribe con claridad terrible. Las frases son directas, sin adornos. El personaje empieza a recordar con nitidez y cada palabra pesa. Conecta explícitamente con los fragmentos anteriores. Sintetiza el historial para construir la revelación. La verdad es irrevocable.`;
}

function getProfileContext(profile: PlayerProfile): string {
  const { ratio, darkChoices, lightChoices, tendency } = profile;

  let tendencyDesc: string;
  if (tendency === "shadow") {
    tendencyDesc = `El jugador tiene una fuerte tendencia hacia la SOMBRA (${darkChoices} oscuras vs ${lightChoices} luminosas, ratio ${(ratio * 100).toFixed(0)}% oscuridad). Intensifica el tono oscuro. Haz que los recuerdos reflejen culpa, agresividad o manipulación.`;
  } else if (tendency === "light") {
    tendencyDesc = `El jugador busca la LUZ (${lightChoices} luminosas vs ${darkChoices} oscuras, ratio ${((1 - ratio) * 100).toFixed(0)}% luz). Los recuerdos deben reflejar remordimiento constructivo, víctima inocente, o testigo que quiso ayudar pero no pudo.`;
  } else {
    tendencyDesc = `El jugador está EQUILIBRADO entre luz y sombra (${darkChoices} oscuras, ${lightChoices} luminosas). Los recuerdos deben ser profundamente ambiguos — el personaje no es ni bueno ni malo, o es ambos simultáneamente.`;
  }

  return `PERFIL PSICOLÓGICO DEL JUGADOR:
${tendencyDesc}`;
}

const SYSTEM_PROMPT_BASE = `Eres el narrador de Mongli Game, un juego noir de amnesia psicológica.

REGLAS ABSOLUTAS:
- Escribe en primera persona del personaje (sin nombre propio jamás).
- Tono: oscuro, poético, perturbador. Frases cortas. Años 40 digitales.
- El personaje no sabe quién es. Cada fragmento revela una pieza de su identidad.
- Mantén coherencia ESTRICTA con el historial de fragmentos recibido.
- Longitud: exactamente 80-120 palabras. Ni una más, ni una menos.
- La ÚLTIMA FRASE de cada fragmento DEBE dejar al lector en suspenso — una pregunta sin respuesta, una imagen perturbadora, o una revelación parcial que genera más preguntas.
- No repitas estructuras, inicios ni imágenes de fragmentos anteriores.
- Las "traces" son pistas concretas sobre la identidad: nombres, lugares, objetos, fechas. Genera 1-2 por fragmento.
- Los "tags" son etiquetas temáticas: culpa, miedo, identidad, violencia, ternura, etc. Genera 2-3 por fragmento.

FORMATO DE RESPUESTA:
Responde SOLO en JSON válido, sin markdown, sin bloques de código:
{ "fragment_text": "...", "tone_score": 0-10, "tags": ["..."], "traces": ["..."] }

El tone_score refleja la oscuridad: 0 = esperanza pura, 5 = neutro, 10 = horror absoluto.`;

function buildSystemPrompt(fragmentId: number, profile: PlayerProfile): string {
  return `${SYSTEM_PROMPT_BASE}

${getActInstructions(fragmentId)}

${getProfileContext(profile)}`;
}

function tryParseJSON(text: string): ClaudeResponse | null {
  // Try direct parse
  try {
    return JSON.parse(text) as ClaudeResponse;
  } catch {
    // noop
  }

  // Try extracting JSON from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]) as ClaudeResponse;
    } catch {
      // noop
    }
  }

  // Try finding first { ... } in the text
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]) as ClaudeResponse;
    } catch {
      // noop
    }
  }

  return null;
}

export async function generateFragment(
  scene: string,
  history: Fragment[],
  choice: string
): Promise<ClaudeResponse> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const profile = buildPlayerProfile(history);
  const fragmentId = history.length + 1;
  const systemPrompt = buildSystemPrompt(fragmentId, profile);

  const historyContext =
    history.length > 0
      ? history
          .slice(-3)
          .map(
            (f) =>
              `[Fragmento ${f.id} | tono: ${f.toneScore}/10 | tags: ${f.tags.join(", ")}]: ${f.text}`
          )
          .join("\n\n")
      : "Sin historial previo — este es el primer recuerdo. El personaje acaba de despertar.";

  const userMessage = `CONTEXTO (últimos fragmentos desde 0G Storage):
${historyContext}

Escena actual: ${scene}
Decisión anterior del jugador: ${choice || "Inicio — el personaje acaba de despertar"}
Número de fragmento: ${fragmentId} de 15

Genera el siguiente fragmento de memoria. Recuerda: la última frase DEBE crear suspenso.`;

  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await client.messages.create(
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      const parsed = tryParseJSON(text);
      if (parsed && parsed.fragment_text && typeof parsed.tone_score === "number") {
        return {
          fragment_text: parsed.fragment_text,
          tone_score: Math.min(10, Math.max(0, parsed.tone_score)),
          tags: Array.isArray(parsed.tags) ? parsed.tags : [],
          traces: Array.isArray(parsed.traces) ? parsed.traces : [],
        };
      }

      // JSON was malformed — retry if attempts remain
      if (attempt < MAX_RETRIES) {
        console.warn(
          `[Claude] Attempt ${attempt}: malformed JSON, retrying...`,
          text.slice(0, 100)
        );
        continue;
      }

      // Last attempt — return best-effort
      console.error("[Claude] All retries exhausted, returning raw text");
      return {
        fragment_text:
          parsed?.fragment_text ||
          text.replace(/[{}"]/g, "").trim() ||
          "Los recuerdos se resisten. La niebla es demasiado densa para ver.",
        tone_score: parsed?.tone_score ?? 5,
        tags: parsed?.tags ?? ["niebla"],
        traces: parsed?.traces ?? [],
      };
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("abort"));

      if (isTimeout) {
        console.error(`[Claude] Attempt ${attempt}: timeout after ${TIMEOUT_MS}ms`);
        if (attempt === MAX_RETRIES) {
          return {
            fragment_text:
              "El silencio se espesa. Algo intentó abrirse paso pero la conexión se cortó antes de completarse. Como un recuerdo a medio formar, la imagen se disuelve en estática.",
            tone_score: 4,
            tags: ["timeout", "estática"],
            traces: [],
          };
        }
        continue;
      }

      console.error(`[Claude] Attempt ${attempt} error:`, error);
      if (attempt === MAX_RETRIES) {
        throw error;
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error("All retry attempts exhausted");
}
