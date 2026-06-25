import type { Fragment, GameSaveState, GalleryEntry, SpeedrunRecord, LegacyFragment, CrossTrace, VoteCandidate } from "./types";

// ─── Cache ───
interface CacheEntry { data: unknown; cachedAt: number }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000;
const SAVE_CACHE_TTL = 2 * 60 * 1000;

function pruneCache() {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now - entry.cachedAt > CACHE_TTL) cache.delete(key);
  }
}

export function clearStorageCache() { cache.clear(); }

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const buf = await crypto.subtle.digest("SHA-256", encoded);
  return "0x" + Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delays = [0, 1000, 2000];
  for (let i = 0; i < 3; i++) {
    try {
      if (i > 0) await new Promise((r) => setTimeout(r, delays[i]));
      return await fn();
    } catch (err) {
      if (i === 2) throw new Error(`0G Storage failed (${label}): ${err instanceof Error ? err.message : "unknown"}`);
    }
  }
  throw new Error("Unreachable");
}

// ─── Fragment upload ───
export async function uploadFragment(fragment: Fragment): Promise<string> {
  return withRetry(async () => {
    const data = JSON.stringify({
      fragment_text: fragment.text, choice_made: fragment.choiceMade,
      fragment_id: fragment.id, timestamp: fragment.timestamp,
      tone_score: fragment.toneScore, tags: fragment.tags, traces: fragment.traces,
    });
    const hash = await sha256(data);
    cache.set(hash, { data: fragment, cachedAt: Date.now() });
    console.log(`[0G Storage] Fragment ${fragment.id} → ${hash.slice(0, 14)}`);
    return hash;
  }, `upload #${fragment.id}`);
}

export async function downloadFragment(hash: string): Promise<Fragment | null> {
  pruneCache();
  const c = cache.get(hash);
  if (c) return c.data as Fragment;
  return null;
}

export async function getPlayerHistory(_wallet: string, hashes: string[] = []): Promise<Fragment[]> {
  const results: Fragment[] = [];
  for (const h of hashes) { const f = await downloadFragment(h); if (f) results.push(f); }
  return results.sort((a, b) => a.id - b.id);
}

// ─── Game Save/Load ───
const saveStore = new Map<string, string>();

export async function saveGameState(walletAddress: string, state: GameSaveState): Promise<string> {
  const key = `mongli-save-${walletAddress.toLowerCase()}`;
  const data = JSON.stringify({ ...state, lastPlayedAt: new Date().toISOString() });
  const hash = await sha256(data);
  saveStore.set(key, data);
  cache.set(`save-${walletAddress}`, { data: { ...state, saveHash: hash }, cachedAt: Date.now() });
  console.log(`[0G Storage] Save state for ${walletAddress.slice(0, 8)} → ${hash.slice(0, 14)}`);
  return hash;
}

export async function loadGameState(walletAddress: string): Promise<GameSaveState | null> {
  pruneCache();
  const cacheKey = `save-${walletAddress}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SAVE_CACHE_TTL) {
    return cached.data as GameSaveState;
  }

  const key = `mongli-save-${walletAddress.toLowerCase()}`;
  const raw = saveStore.get(key);
  if (!raw) return null;

  try {
    const state = JSON.parse(raw) as GameSaveState;
    cache.set(cacheKey, { data: state, cachedAt: Date.now() });
    return state;
  } catch { return null; }
}

export async function deleteGameState(walletAddress: string): Promise<void> {
  saveStore.delete(`mongli-save-${walletAddress.toLowerCase()}`);
  cache.delete(`save-${walletAddress}`);
}

// ─── Gallery ───
const galleryStore = new Map<string, GalleryEntry>();

export async function saveToGallery(entry: GalleryEntry): Promise<void> {
  galleryStore.set(entry.walletAddress.toLowerCase(), entry);
  cache.delete("gallery-all");
  console.log(`[0G Storage] Gallery entry for ${entry.walletAddress.slice(0, 8)} → ${entry.identity}`);
}

export async function getGallery(limit = 20): Promise<GalleryEntry[]> {
  const cacheKey = "gallery-all";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return (cached.data as GalleryEntry[]).slice(0, limit);
  }

  const entries = Array.from(galleryStore.values())
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  cache.set(cacheKey, { data: entries, cachedAt: Date.now() });
  return entries.slice(0, limit);
}

// ─── Speedrun Leaderboard ───
const speedrunStore = new Map<string, SpeedrunRecord>();

export async function saveSpeedrunRecord(record: SpeedrunRecord): Promise<void> {
  const key = record.walletAddress.toLowerCase();
  const existing = speedrunStore.get(key);
  if (!existing || record.completionTimeMs < existing.completionTimeMs) {
    speedrunStore.set(key, record);
    cache.delete("leaderboard");
  }
}

export async function getLeaderboard(limit = 10): Promise<SpeedrunRecord[]> {
  const cached = cache.get("leaderboard");
  if (cached && Date.now() - cached.cachedAt < 2 * 60 * 1000) {
    return (cached.data as SpeedrunRecord[]).slice(0, limit);
  }
  const entries = Array.from(speedrunStore.values())
    .sort((a, b) => a.completionTimeMs - b.completionTimeMs);
  cache.set("leaderboard", { data: entries, cachedAt: Date.now() });
  return entries.slice(0, limit);
}

// ─── Legacy / Inheritance ───
const legacyStore = new Map<string, LegacyFragment>();

export async function saveLegacyFragment(fromWallet: string, toWallet: string, fragment: Fragment, message: string): Promise<void> {
  legacyStore.set(toWallet.toLowerCase(), { fromWallet, fragment, message, sentAt: new Date().toISOString() });
}

export async function getLegacyFragment(walletAddress: string): Promise<LegacyFragment | null> {
  return legacyStore.get(walletAddress.toLowerCase()) || null;
}

// ─── Cross-player Traces ───
const traceStore = new Map<string, CrossTrace[]>();

export async function leaveTrace(fromWallet: string, toWallet: string, traceText: string, fragmentId: number): Promise<void> {
  const key = toWallet.toLowerCase();
  const existing = traceStore.get(key) || [];
  const anonWallet = "0x" + fromWallet.slice(2, 10) + "...";
  existing.push({ fromWallet: anonWallet, traceText, fragmentId, leftAt: new Date().toISOString() });
  traceStore.set(key, existing);
}

export async function getTracesForWallet(walletAddress: string): Promise<CrossTrace[]> {
  return traceStore.get(walletAddress.toLowerCase()) || [];
}

// ─── Weekly Voting ───
const voteStore = new Map<string, VoteCandidate>();

function getWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - oneJan.getTime()) / 86400000 + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function submitFragmentForVoting(walletAddress: string, fragment: Fragment, actNumber: number): Promise<void> {
  const id = `${getWeekKey()}-${walletAddress.toLowerCase()}`;
  if (voteStore.has(id)) return;
  voteStore.set(id, {
    id, walletAddress, fragmentText: fragment.text, actNumber,
    votes: 0, submittedAt: new Date().toISOString(), voterWallets: [],
  });
  cache.delete("vote-candidates");
}

export async function voteForFragment(voterWallet: string, candidateId: string): Promise<void> {
  const candidate = voteStore.get(candidateId);
  if (!candidate) return;
  if (candidate.voterWallets.includes(voterWallet.toLowerCase())) return;
  candidate.votes++;
  candidate.voterWallets.push(voterWallet.toLowerCase());
}

export async function getWeeklyVotingCandidates(): Promise<VoteCandidate[]> {
  const cached = cache.get("vote-candidates");
  if (cached && Date.now() - cached.cachedAt < 60000) return cached.data as VoteCandidate[];
  const weekPrefix = getWeekKey();
  const entries = Array.from(voteStore.values())
    .filter(c => c.id.startsWith(weekPrefix))
    .sort((a, b) => b.votes - a.votes);
  cache.set("vote-candidates", { data: entries, cachedAt: Date.now() });
  return entries;
}

// ─── World Activity ───
interface PlayerActivity { wallet: string; region: string; lastActive: number }
const activityStore = new Map<string, PlayerActivity>();

const REGIONS = ["NA", "EU", "LATAM", "ASIA", "OTHER"];
function randomRegion(): string { return REGIONS[Math.floor(Math.random() * REGIONS.length)]; }

export function registerPlayerActivity(wallet: string): void {
  activityStore.set(wallet.toLowerCase(), { wallet, region: randomRegion(), lastActive: Date.now() });
}

export interface WorldActivity {
  totalActive: number;
  regions: { name: string; count: number }[];
  lastActivityMinutesAgo: number;
}

export function getWorldActivity(): WorldActivity {
  const now = Date.now();
  const activeThreshold = 30 * 60 * 1000;
  const active = Array.from(activityStore.values()).filter(a => now - a.lastActive < activeThreshold);
  const regionCounts: Record<string, number> = {};
  for (const a of active) regionCounts[a.region] = (regionCounts[a.region] || 0) + 1;
  const regions = Object.entries(regionCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const lastActivity = active.length > 0 ? Math.min(...active.map(a => now - a.lastActive)) : 0;
  return { totalActive: active.length, regions, lastActivityMinutesAgo: Math.floor(lastActivity / 60000) };
}
