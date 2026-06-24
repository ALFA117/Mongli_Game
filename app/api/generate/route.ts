import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 500 });

  try {
    const body = await request.json();
    const lang = body.lang || "es";
    const scene = body.scene || "Una habitación oscura";
    const desc = body.desc || "";
    const historyArr: string[] = body.history || [];
    const fragmentNumber = body.fragmentNumber || 1;

    const systemPrompt = `You are the narrator of MONGLI, a psychological noir amnesia game.
Write in first person. Tone: dark, atmospheric, poetic. Short sentences.
EXACTLY 60-80 words. No more, no less.
Location: ${scene}. ${desc}
Fragment ${fragmentNumber} of 3 for this location.
${fragmentNumber === 1 ? "First impression. Sensory details. Something feels wrong." : ""}
${fragmentNumber === 2 ? "Deeper. A memory surfaces. Identity blurs." : ""}
${fragmentNumber === 3 ? "Revelation. A piece of truth. The memory crystallizes." : ""}
End with exactly:
${lang === "es" ? "[OPCIÓN A]: <choice in Spanish>\n[OPCIÓN B]: <choice in Spanish>" : "[OPTION A]: <choice in English>\n[OPTION B]: <choice in English>"}
Write in ${lang === "es" ? "Spanish" : "English"}.`;

    const historyContext = historyArr.length > 0
      ? `Previous choices: ${historyArr.slice(-3).join(" → ")}`
      : "No previous choices.";

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: `${historyContext}\nGenerate the next memory fragment.` }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      fragment: text,
      fragment_text: text,
      storage_hash: "0x" + Math.random().toString(16).slice(2).padEnd(64, "0"),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
