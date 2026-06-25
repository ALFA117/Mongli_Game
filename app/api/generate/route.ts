import { NextResponse } from "next/server";
import { generateFragment } from "@/lib/claude";
import { uploadFragment } from "@/lib/og-storage";
import { saveFragmentOnChain } from "@/lib/og-chain";
import { getChoicesForFragment } from "@/lib/choices";
import type { Fragment, GenerateRequest } from "@/lib/types";

// ─── Rate limiting ───
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 8000;

// Clean rate limit map every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => rateLimitMap.clear(), 5 * 60 * 1000);
}

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

// ─── Fallback storage ───
const fallbackStorage = new Map<string, Fragment>();

export async function POST(request: Request) {
  const startTime = Date.now();

  // Rate limit check
  const ip = getClientIP(request);
  const lastRequest = rateLimitMap.get(ip);
  if (lastRequest && Date.now() - lastRequest < RATE_LIMIT_MS) {
    const retryAfter = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastRequest)) / 1000);
    return NextResponse.json(
      { error: "Los recuerdos necesitan tiempo para emerger. Espera un momento.", retryAfter },
      { status: 429 }
    );
  }
  rateLimitMap.set(ip, Date.now());

  try {
    const body: GenerateRequest = await request.json();
    const { scene, history, choice, fragmentId } = body;

    // Generate with AI cascade
    const claudeStart = Date.now();
    const claudeResponse = await generateFragment(scene, history, choice);
    const claudeMs = Date.now() - claudeStart;

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

    // Upload to 0G Storage (with fallback)
    let storageHash = "";
    let storageFallback = false;
    const storageStart = Date.now();
    try {
      storageHash = await uploadFragment(fragment);
    } catch {
      storageFallback = true;
      storageHash = `local-${Date.now()}-${fragmentId}`;
      fallbackStorage.set(storageHash, fragment);
    }
    const storageMs = Date.now() - storageStart;
    fragment.storageHash = storageHash;

    // Save to 0G Chain (non-blocking, ok to fail)
    let txHash: string | null = null;
    let chainError = false;
    const chainStart = Date.now();
    try {
      txHash = await saveFragmentOnChain(storageHash, fragmentId);
    } catch {
      chainError = true;
    }
    const chainMs = Date.now() - chainStart;
    if (txHash) fragment.txHash = txHash;

    const allFragments = [...history, fragment];
    const choices = getChoicesForFragment(fragmentId + 1, allFragments);

    const totalMs = Date.now() - startTime;
    console.log(
      `[MONGLI][${new Date().toISOString()}] GENERATE | model: ${claudeResponse.aiModel} | claude: ${claudeMs}ms | storage: ${storageMs}ms | chain: ${chainMs}ms | total: ${totalMs}ms`
    );

    return NextResponse.json({
      fragment,
      choices,
      storageHash,
      txHash,
      aiModel: claudeResponse.aiModel,
      storageFallback,
      chainError,
    });
  } catch (error) {
    console.error("[MONGLI] Generate error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate fragment: ${errorMessage}` },
      { status: 500 }
    );
  }
}
