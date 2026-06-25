import { NextResponse } from "next/server";
import { getPlayerHistory } from "@/lib/og-storage";

const historyCache = new Map<string, { data: unknown; cachedAt: number }>();
const CACHE_TTL = 30000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet");

  if (!wallet || !wallet.startsWith("0x")) {
    return NextResponse.json({ error: "wallet parameter required" }, { status: 400 });
  }

  // Check cache
  const cached = historyCache.get(wallet);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const history = await getPlayerHistory(wallet);
    const response = { wallet, acts: history, totalFragments: history.length };

    historyCache.set(wallet, { data: response, cachedAt: Date.now() });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[MONGLI] History error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
