import { NextResponse } from "next/server";
import { generateFragment } from "@/lib/claude";
import { uploadFragment } from "@/lib/og-storage";
import { saveFragmentOnChain } from "@/lib/og-chain";
import { getChoicesForFragment } from "@/lib/choices";
import type { Fragment, GenerateRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();
    const { scene, history, choice, fragmentId } = body;

    const claudeResponse = await generateFragment(scene, history, choice);

    const fragment: Fragment = {
      id: fragmentId,
      text: claudeResponse.fragment_text,
      toneScore: claudeResponse.tone_score,
      tags: claudeResponse.tags,
      traces: claudeResponse.traces,
      choiceMade: choice,
      timestamp: Date.now(),
      unlocked: true,
    };

    const storageHash = await uploadFragment(fragment);
    fragment.storageHash = storageHash;

    const txHash = await saveFragmentOnChain(storageHash, fragmentId);
    fragment.txHash = txHash;

    const allFragments = [...history, fragment];
    const choices = getChoicesForFragment(fragmentId + 1, allFragments);

    return NextResponse.json({
      fragment,
      choices,
      storageHash,
      txHash,
      aiModel: claudeResponse.aiModel || "demo",
    });
  } catch (error) {
    console.error("[API] Generate error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to generate fragment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
