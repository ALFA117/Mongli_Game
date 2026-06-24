import { Fragment } from "./types";

const OG_STORAGE_RPC = process.env.OG_STORAGE_RPC || "";

export async function uploadFragment(fragment: Fragment): Promise<string> {
  const blob = new TextEncoder().encode(JSON.stringify(fragment));

  try {
    const response = await fetch(`${OG_STORAGE_RPC}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: blob,
    });

    if (!response.ok) {
      console.warn("0G Storage upload failed, using local hash fallback");
      return generateLocalHash(fragment);
    }

    const data = await response.json();
    return data.hash || generateLocalHash(fragment);
  } catch {
    console.warn("0G Storage unavailable, using local hash");
    return generateLocalHash(fragment);
  }
}

export async function downloadFragment(hash: string): Promise<Fragment | null> {
  try {
    const response = await fetch(`${OG_STORAGE_RPC}/download/${hash}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function generateLocalHash(fragment: Fragment): string {
  const str = JSON.stringify(fragment);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(64, "0");
}
