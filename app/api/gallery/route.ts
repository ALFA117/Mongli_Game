import { NextResponse } from "next/server";
import { saveToGallery, getGallery } from "@/lib/og-storage";
import type { GalleryEntry } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const entry = await request.json() as GalleryEntry;
    if (!entry.walletAddress?.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
    }
    await saveToGallery(entry);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20", 10);
  const filter = url.searchParams.get("filter") || "all";

  let entries = await getGallery(100);
  if (filter !== "all") {
    entries = entries.filter((e) => e.identity === filter);
  }
  return NextResponse.json({ entries: entries.slice(0, limit), total: entries.length });
}
