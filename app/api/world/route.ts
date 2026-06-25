import { NextResponse } from "next/server";
import { getWorldActivity, registerPlayerActivity } from "@/lib/og-storage";

export async function GET() {
  return NextResponse.json(getWorldActivity());
}

export async function POST(request: Request) {
  try {
    const { wallet } = await request.json();
    if (wallet) registerPlayerActivity(wallet);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
