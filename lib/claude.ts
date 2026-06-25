import Anthropic from "@anthropic-ai/sdk";
import type { ClaudeResponse, Fragment, PlayerProfile, PreviousRunSummary } from "./types";
import { buildPlayerProfile } from "./types";

// ─── Fallback fragments for demo mode ───
const FALLBACK_FRAGMENTS: ClaudeResponse[] = [
  {
    fragment_text: "Los ojos se abren. No hay techo, solo oscuridad líquida que gotea hacia adentro. Mis manos no son mías — demasiado limpias para lo que siento por dentro. Hay un olor: tabaco viejo, tinta fresca, algo metálico que no quiero nombrar. Una maleta abierta. Ropa que no reconozco pero que huele a mí. En el bolsillo del abrigo, una nota doblada tres veces: 'No confíes en lo que recuerdes primero.' La letra es mía. ¿Por qué me advertiría a mí mismo?",
    tone_score: 6, tags: ["identidad", "confusión", "advertencia"], traces: ["nota doblada tres veces", "olor a tinta fresca"],
  },
  {
    fragment_text: "El pasillo se estira como una garganta. Cada puerta cerrada guarda un eco que no puedo descifrar. Camino sin saber hacia dónde, pero mis pies conocen el camino — músculo memoria de noches que mi mente borró. Un espejo roto al final del corredor. En cada fragmento veo un rostro distinto: uno sonríe, otro llora, el tercero mira con una calma que hiela. ¿Cuál de ellos soy? El cristal cruje bajo mis zapatos. Alguien estuvo aquí antes que yo. O fui yo, en otra vida.",
    tone_score: 7, tags: ["espejo", "identidad fragmentada", "memoria corporal"], traces: ["espejo roto en el corredor", "tres rostros distintos"],
  },
  {
    fragment_text: "Hay una fotografía en el suelo. Boca abajo, como si alguien la hubiera dejado caer con prisa. La levanto: dos figuras en un muelle, atardecer cobrizo, una de ellas soy yo. La otra tiene el rostro borrado — no por el tiempo, sino con intención. Alguien raspó la emulsión con una moneda. Mi sonrisa en la foto es auténtica. Eso es lo que más me perturba. ¿Cómo puedo sonreír así junto a alguien cuyo rostro necesitó ser destruido?",
    tone_score: 8, tags: ["fotografía", "relación borrada", "culpa"], traces: ["fotografía del muelle", "rostro borrado deliberadamente"],
  },
  {
    fragment_text: "El teléfono suena. Lo tomo sin pensar — el gesto es automático, un reflejo que sobrevivió al olvido. Silencio al otro lado. No, no silencio: respiración contenida, el tipo de respiración de quien quiere ser escuchado sin hablar. Dejo que el tiempo se espese entre nosotros. Luego, una sola palabra, susurrada con la urgencia de quien sabe que la línea no es segura: mi nombre. Un nombre que no reconozco. Pero mi corazón se acelera como si lo hubiera esperado toda la vida.",
    tone_score: 7, tags: ["teléfono", "nombre desconocido", "reconocimiento"], traces: ["llamada anónima", "nombre susurrado"],
  },
  {
    fragment_text: "Bajo las escaleras hacia el sótano. No porque quiera — porque algo en mí sabe que es necesario. El aire cambia: más frío, más honesto. Las paredes de concreto guardan marcas de conteo. Alguien estuvo encerrado aquí. Los trazos son regulares, disciplinados — no desesperación sino rutina. Cuento: trescientos doce días. En la esquina, grabado con algo afilado, un mapa. Calles que conozco. Un punto marcado con una X y una fecha. La fecha es mañana.",
    tone_score: 9, tags: ["sótano", "cautiverio", "mapa oculto"], traces: ["312 días de cautiverio", "mapa con fecha de mañana"],
  },
];

function getFallback(fragmentId: number): ClaudeResponse {
  return FALLBACK_FRAGMENTS[(fragmentId - 1) % FALLBACK_FRAGMENTS.length];
}

// ─── Prompt builders ───

function buildPrompt(scene: string, history: Fragment[], choice: string, previousRun?: PreviousRunSummary): { system: string; user: string } {
  const profile = buildPlayerProfile(history);
  const fragmentId = history.length + 1;

  const actInstr = fragmentId <= 5
    ? "ACTO I: Lento, confuso, desorientado. Frases fragmentadas. Sensorial."
    : fragmentId <= 12
    ? "ACTO II: Tenso, urgente. Contradicciones. Lucidez mezclada con confusión."
    : "ACTO III: Claridad terrible. Frases directas. Conecta con fragmentos anteriores.";

  const profileInstr = profile.tendency === "shadow"
    ? `Tendencia SOMBRA (${profile.darkChoices}/${profile.darkChoices + profile.lightChoices}). Intensifica oscuridad.`
    : profile.tendency === "light"
    ? `Tendencia LUZ (${profile.lightChoices}/${profile.darkChoices + profile.lightChoices}). Refleja remordimiento.`
    : `EQUILIBRADO. Recuerdos ambiguos.`;

  const ngPlus = previousRun
    ? `\nNEW GAME+: El jugador ya jugó antes. Identidad anterior: ${previousRun.identity}. Decisiones clave: ${previousRun.keyDecisions.join(", ")}. Esta segunda vuelta debe sentirse diferente — ecos inquietantes de la vida anterior. Tono más oscuro y urgente.`
    : "";

  const system = `Eres el narrador de Mongli Game, juego noir de amnesia psicológica.
Primera persona (sin nombre). Tono: oscuro, poético, perturbador. Frases cortas. 80-120 palabras.
La ÚLTIMA FRASE debe crear suspenso. ${actInstr} ${profileInstr}${ngPlus}
Responde SOLO JSON: { "fragment_text": "...", "tone_score": 0-10, "tags": ["..."], "traces": ["..."] }`;

  const historyCtx = history.length > 0
    ? history.slice(-3).map((f) => `[#${f.id}]: ${f.text}`).join("\n")
    : "Sin historial — primer recuerdo.";

  const user = `CONTEXTO:\n${historyCtx}\n\nEscena: ${scene}\nDecisión: ${choice || "Inicio"}\nFragmento ${fragmentId}/15.`;

  return { system, user };
}

function tryParseJSON(text: string): ClaudeResponse | null {
  try { return JSON.parse(text) as ClaudeResponse; } catch { /* */ }
  const match = text.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]) as ClaudeResponse; } catch { /* */ } }
  return null;
}

function validateResponse(parsed: ClaudeResponse | null): ClaudeResponse | null {
  if (!parsed?.fragment_text || typeof parsed.tone_score !== "number") return null;
  return {
    fragment_text: parsed.fragment_text,
    tone_score: Math.min(10, Math.max(0, parsed.tone_score)),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    traces: Array.isArray(parsed.traces) ? parsed.traces : [],
  };
}

// ─── Claude (Anthropic) ───

async function generateWithClaude(system: string, user: string): Promise<ClaudeResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.length < 20) throw new Error("NO_API_KEY");

  const client = new Anthropic({ apiKey });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await client.messages.create(
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        system,
        messages: [{ role: "user", content: user }],
      },
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const valid = validateResponse(tryParseJSON(text));
    if (valid) return valid;
    throw new Error("MALFORMED_JSON");
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Gemini (Google) ───

async function generateWithGemini(system: string, user: string): Promise<ClaudeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error("NO_GEMINI_KEY");

  const fullPrompt = `${system}\n\n${user}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 500,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      throw new Error(`GEMINI_${response.status}: ${errBody.slice(0, 100)}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const valid = validateResponse(tryParseJSON(text));
    if (valid) return valid;
    throw new Error("GEMINI_MALFORMED_JSON");
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Main export: cascade Claude → Gemini → Demo ───

export interface GenerateResult extends ClaudeResponse {
  aiModel: "claude" | "gemini" | "demo";
}

export async function generateFragment(
  scene: string,
  history: Fragment[],
  choice: string,
  previousRun?: PreviousRunSummary
): Promise<GenerateResult> {
  const { system, user } = buildPrompt(scene, history, choice, previousRun);
  const fragmentId = history.length + 1;

  // 1. Try Claude
  try {
    const result = await generateWithClaude(system, user);
    console.log("[MONGLI] Using: claude");
    return { ...result, aiModel: "claude" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[MONGLI] Claude failed: ${msg.slice(0, 80)}`);
  }

  // 2. Try Gemini
  try {
    const result = await generateWithGemini(system, user);
    console.log("[MONGLI] Using: gemini");
    return { ...result, aiModel: "gemini" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[MONGLI] Gemini failed: ${msg.slice(0, 80)}`);
  }

  // 3. Demo fallback
  console.log("[MONGLI] Using: demo");
  return { ...getFallback(fragmentId), aiModel: "demo" };
}
