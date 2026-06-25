import { NextResponse } from "next/server";
import { submitFragmentForVoting, voteForFragment, getWeeklyVotingCandidates } from "@/lib/og-storage";
import type { Fragment } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action === "submit") {
      await submitFragmentForVoting(body.walletAddress, body.fragment as Fragment, body.actNumber);
      return NextResponse.json({ success: true });
    }
    if (body.action === "vote") {
      await voteForFragment(body.voterWallet, body.candidateId);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET() {
  const candidates = await getWeeklyVotingCandidates();
  return NextResponse.json({ candidates });
}
