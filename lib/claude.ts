import Anthropic from "@anthropic-ai/sdk";
import { Fragment } from "./types";

const SYSTEM_PROMPT = `Eres el narrador de Mongli Game, un juego noir de amnesia psicológica.
Escribe en primera persona del personaje (sin nombre).
Tono: oscuro, poético, perturbador. Frases cortas. Años 40 digitales.
El personaje no sabe quién es. Cada fragmento revela una pieza.
Mantén coherencia con el historial recibido.
Longitud: exactamente 80-120 palabras.

REGLAS NARRATIVAS:
- Acto I (fragmentos 1-5): Identidad desconocida, fragmentos ambiguos, desorientación
- Acto II (fragmentos 6-12): Dos identidades posibles emergen (¿héroe o villano?)
- Acto III (fragmentos 13-15): Síntesis final, revelación única basada en todas las decisiones

Responde SOLO en JSON válido con esta estructura exacta:
{
  "fragment_text": "texto del fragmento...",
  "tone_score": 7,
  "tags": ["memoria", "culpa"],
  "traces": ["una cicatriz en la mano izquierda"],
  "choices": [
    {"id": "a", "text": "Seguir la sombra", "tone": "dark"},
    {"id": "b", "text": "Retroceder hacia la luz", "tone": "light"}
  ]
}`;

function buildContext(history: Fragment[], currentFragmentId: number): string {
  const recent = history.slice(-3);
  const act =
    currentFragmentId <= 5 ? "I" : currentFragmentId <= 12 ? "II" : "III";

  let context = `Acto actual: ${act} (fragmento #${currentFragmentId} de 15)\n`;

  if (recent.length === 0) {
    context += "No hay historial previo. Este es el primer fragmento.";
  } else {
    context += "Historial reciente:\n";
    recent.forEach((f) => {
      context += `--- Fragmento #${f.id} ---\n`;
      context += `Texto: ${f.text}\n`;
      context += `Decisión tomada: ${f.choice_made}\n`;
      context += `Tags: ${f.tags.join(", ")}\n`;
      context += `Trazas reveladas: ${f.traces.join(", ")}\n\n`;
    });
  }

  if (act === "III") {
    context +=
      "\nIMPORTANTE: Este es el acto final. Sintetiza TODAS las decisiones y trazas anteriores para crear una revelación coherente y única. El personaje debe descubrir quién es realmente.";
  }

  return context;
}

export async function generateFragment(
  scene: string,
  choice: string,
  history: Fragment[],
  fragmentId: number
): Promise<{
  fragment_text: string;
  tone_score: number;
  tags: string[];
  traces: string[];
  choices: { id: string; text: string; tone: "dark" | "light" }[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const anthropic = new Anthropic({ apiKey });
  const context = buildContext(history, fragmentId);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `CONTEXTO (historial desde 0G):\n${context}\n\nEscena actual: ${scene}\nDecisión anterior: ${choice || "Ninguna (inicio del juego)"}\nGenera el siguiente fragmento de memoria.`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("La IA no devolvió JSON válido");

  return JSON.parse(jsonMatch[0]);
}
