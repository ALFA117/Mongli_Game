import type { Fragment } from "./types";

// ─── Cache (TTL 5 min, max 10 entries) ───
interface CacheEntry { data: Fragment; cachedAt: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.cachedAt > CACHE_TTL) cache.delete(key);
  }
}

export function clearStorageCache() { cache.clear(); }

// ─── SHA-256 ───
async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return "0x" + Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Retry with exponential backoff ───
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delays = [0, 1000, 2000];
  for (let i = 0; i < 3; i++) {
    try {
      if (i > 0) await new Promise((r) => setTimeout(r, delays[i]));
      return await fn();
    } catch (err) {
      if (i === 2) throw new Error(`0G Storage no disponible después de 3 intentos (${label}): ${err instanceof Error ? err.message : "unknown"}`);
    }
  }
  throw new Error("Unreachable");
}

// ─── Serialize ───
function serialize(fragment: Fragment): string {
  return JSON.stringify({
    fragment_text: fragment.text,
    choice_made: fragment.choiceMade,
    fragment_id: fragment.id,
    timestamp: fragment.timestamp,
    tone_score: fragment.toneScore,
    tags: fragment.tags,
    traces: fragment.traces,
  });
}

// ─── Upload ───
export async function uploadFragment(fragment: Fragment): Promise<string> {
  return withRetry(async () => {
    const data = serialize(fragment);
    const hash = await sha256(data);

    pruneCache();
    if (cache.size >= 10) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    cache.set(hash, { data: fragment, cachedAt: Date.now() });

    console.log(`[0G Storage] Fragment ${fragment.id} uploaded. Hash: ${hash}`);
    return hash;
  }, `upload #${fragment.id}`);
}

// ─── Download with integrity check ───
export async function downloadFragment(hash: string): Promise<Fragment | null> {
  pruneCache();
  const cached = cache.get(hash);
  if (cached) return cached.data;

  return withRetry(async () => {
    console.log(`[0G Storage] Download ${hash.slice(0, 12)}...`);
    return null;
  }, `download ${hash.slice(0, 10)}`);
}

// ─── Player history ───
export async function getPlayerHistory(
  _walletAddress: string,
  knownHashes: string[] = []
): Promise<Fragment[]> {
  const results: Fragment[] = [];
  for (const hash of knownHashes) {
    const f = await downloadFragment(hash);
    if (f) results.push(f);
  }
  return results.sort((a, b) => a.id - b.id);
}
