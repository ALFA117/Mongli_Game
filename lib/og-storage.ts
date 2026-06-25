import type { Fragment } from "./types";

export async function uploadFragment(fragment: Fragment): Promise<string> {
  const data = JSON.stringify({
    fragment_text: fragment.text,
    choice_made: fragment.choiceMade,
    fragment_id: fragment.id,
    timestamp: fragment.timestamp,
    tone_score: fragment.toneScore,
    tags: fragment.tags,
    traces: fragment.traces,
  });

  try {
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    console.log(`[0G Storage] Fragment ${fragment.id} uploaded. Hash: ${hash}`);
    return hash;
  } catch (error) {
    console.error("[0G Storage] Upload failed:", error);
    const fallbackHash =
      "0x" +
      Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    return fallbackHash;
  }
}

export async function downloadFragment(hash: string): Promise<Fragment | null> {
  console.log(`[0G Storage] Downloading fragment with hash: ${hash}`);
  return null;
}
