import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { uploadFragment } from "@/lib/og-storage";
import { Fragment } from "@/lib/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const scene = body.scene || "Una habitación oscura";
    const choice = body.choice || "";
    const historyArr: string[] = body.history || [];
    const fragmentNumber = body.fragmentNumber || body.fragment_id || historyArr.length + 1;
    const lang = body.lang || "es";

    const systemPrompt = `You are the narrator of MONGLI, a psychological noir amnesia game.
Write in first person, past tense. Tone: dark, poetic, disturbing. Short sentences.
Fragment length: EXACTLY 60-80 words. No more.
End with exactly these two lines:
[OPCIÓN A]: <short choice in ${lang === "es" ? "Spanish" : "English"}>
[OPCIÓN B]: <short choice in ${lang === "es" ? "Spanish" : "English"}>
Write in ${lang === "es" ? "Spanish" : "English"}.
Current fragment: ${fragmentNumber} of 10.
${fragmentNumber <= 5 ? "Act I: Unknown identity, disorientation, amnesia." : ""}
${fragmentNumber > 5 && fragmentNumber <= 8 ? "Act II: Two possible identities emerge. Hero or villain?" : ""}
${fragmentNumber > 8 ? "Act III: Final revelation. Synthesize ALL previous choices into a unique ending." : ""}`;

    const historyContext = historyArr.length > 0
      ? `Previous choices: ${historyArr.slice(-3).join(" → ")}`
      : "No previous history. This is the first fragment.";

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Scene: ${scene}\nChoice: ${choice || "None (game start)"}\n${historyContext}\nGenerate the next memory fragment.`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const fragment: Fragment = {
      id: fragmentNumber,
      text: text,
      choice_made: choice || "inicio",
      tone_score: 5,
      tags: [],
      traces: [],
      storage_hash: "",
      tx_hash: "",
      timestamp: Date.now(),
    };

    const storageHash = await uploadFragment(fragment);
    fragment.storage_hash = storageHash;

    return NextResponse.json({
      fragment,
      fragment_text: text,
      storage_hash: storageHash,
      choices: [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate error:", message);
    return NextResponse.json({ error: "Error generando fragmento", details: message }, { status: 500 });
  }
}
