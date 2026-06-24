import { NextRequest, NextResponse } from "next/server";
import { generateFragment } from "@/lib/claude";
import { uploadFragment } from "@/lib/og-storage";
import { Fragment, GenerateRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const body: GenerateRequest = await request.json();
    const { scene, choice, history, fragment_id } = body;

    const aiResult = await generateFragment(scene, choice, history, fragment_id);

    const fragment: Fragment = {
      id: fragment_id,
      text: aiResult.fragment_text,
      choice_made: choice || "inicio",
      tone_score: aiResult.tone_score,
      tags: aiResult.tags,
      traces: aiResult.traces,
      storage_hash: "",
      tx_hash: "",
      timestamp: Date.now(),
    };

    const storageHash = await uploadFragment(fragment);
    fragment.storage_hash = storageHash;

    return NextResponse.json({
      fragment,
      choices: aiResult.choices,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Generate error:", message);
    return NextResponse.json(
      { error: "Error generando fragmento", details: message },
      { status: 500 }
    );
  }
}
