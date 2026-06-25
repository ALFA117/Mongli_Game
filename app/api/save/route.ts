import { NextResponse } from "next/server";
import { saveGameState, loadGameState, deleteGameState } from "@/lib/og-storage";
import type { GameSaveState } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { walletAddress, gameState } = await request.json() as {
      walletAddress: string;
      gameState: GameSaveState;
    };
    if (!walletAddress?.startsWith("0x")) {
      return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
    }
    const hash = await saveGameState(walletAddress, gameState);
    return NextResponse.json({ success: true, saveHash: hash });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ exists: false });
  }
  const state = await loadGameState(wallet);
  if (!state) return NextResponse.json({ exists: false });
  return NextResponse.json({ exists: true, ...state });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet");
  if (!wallet?.startsWith("0x")) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  await deleteGameState(wallet);
  return NextResponse.json({ success: true });
}
