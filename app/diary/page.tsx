"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Providers from "@/components/Providers";
import Cursor from "@/components/Cursor";
import { useAccount } from "wagmi";
import { ACTS } from "@/lib/types";
import type { GameSaveState, ActRecord } from "@/lib/types";

function DiaryContent() {
  const router = useRouter();
  const { address } = useAccount();
  const [data, setData] = useState<GameSaveState | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    fetch(`/api/save?wallet=${address}`)
      .then(r => r.json())
      .then(d => { if (d.exists) setData(d as GameSaveState); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  const acts = data?.completedActs || [];
  const allFragments = acts.flatMap((a, ai) =>
    (a.fragments || []).map((f, fi) => ({ ...f, actIdx: ai, actTitle: ACTS[ai]?.title || `Acto ${ai + 1}`, decision: fi === (a.fragments?.length || 0) - 1 ? a.decision : undefined }))
  );
  const totalPages = allFragments.length;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f4e8c1" }}><p style={{ color: "#2a1a0a", fontFamily: "Caveat, cursive" }}>Abriendo diario...</p></div>;
  if (!data || totalPages === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#f4e8c1" }}>
      <p style={{ color: "#2a1a0a", fontFamily: "Caveat, cursive", fontSize: 18 }}>El diario está vacío.</p>
      <button onClick={() => router.push("/game")} className="mt-4 px-4 py-2 border border-[#2a1a0a]/30 text-[#2a1a0a] font-body text-xs">Comenzar a escribir</button>
    </div>
  );

  const frag = allFragments[page];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f4e8c1", color: "#2a1a0a" }}>
      <Cursor />

      {/* Cover / Header */}
      <header className="flex items-center justify-between p-4 border-b" style={{ borderColor: "#c4a87040" }}>
        <div>
          <h1 style={{ fontFamily: "Special Elite, cursive" }} className="text-sm tracking-wider">DIARIO PERSONAL</h1>
          <p className="font-mono text-[8px] opacity-40">Propiedad de: {address?.slice(0, 8)}...{address?.slice(-4)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-body text-red-800/40 uppercase tracking-wider border border-red-800/20 px-1.5 py-0.5 rotate-[-3deg]">Confidencial</span>
          <button onClick={() => router.push("/history")} className="text-[10px] font-body opacity-50 hover:opacity-100" style={{ color: "#2a1a0a" }}>← Volver</button>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div key={page}
            initial={{ opacity: 0, rotateY: -5 }} animate={{ opacity: 1, rotateY: 0 }} exit={{ opacity: 0, rotateY: 5 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-lg relative"
            style={{ perspective: 800 }}>
            {/* Page */}
            <div className="p-6 sm:p-10 min-h-[400px] relative" style={{
              background: "linear-gradient(135deg, #f4e8c1 0%, #eddcaa 50%, #f4e8c1 100%)",
              boxShadow: "4px 4px 12px rgba(0,0,0,0.1), inset 0 0 40px rgba(0,0,0,0.03)",
              border: "1px solid #c4a87030",
            }}>
              {/* Page number */}
              <span className="absolute top-3 right-4 font-mono text-[10px] opacity-30">{page + 1}/{totalPages}</span>

              {/* Date */}
              <p style={{ fontFamily: "Special Elite, cursive" }} className="text-[10px] opacity-40 mb-4">
                {new Date(frag.timestamp).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
                {" — "}{new Date(frag.timestamp).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
              </p>

              {/* Act title */}
              <p style={{ fontFamily: "Special Elite, cursive" }} className="text-xs opacity-50 mb-4 tracking-wider uppercase">
                {frag.actTitle}
              </p>

              {/* Tone margin indicator */}
              <div className="absolute left-2 top-20 bottom-10 w-1 rounded-full" style={{
                backgroundColor: frag.toneScore > 7 ? "#8b0000" : frag.toneScore < 4 ? "#1a3a5c" : "#8b6914",
                opacity: 0.15,
              }} />

              {/* Fragment text */}
              <p style={{ fontFamily: "Caveat, cursive", fontSize: 18, lineHeight: 2 }} className="mb-6">
                {frag.text}
              </p>

              {/* Decision */}
              {frag.decision && (
                <p style={{ fontFamily: "Caveat, cursive", fontSize: 14, borderColor: "#c4a87030" }} className="opacity-50 italic border-t pt-3">
                  Decidí: <span className={frag.decision.toLowerCase().includes("oscur") || frag.decision.toLowerCase().includes("quem") || frag.decision.toLowerCase().includes("sombra") ? "line-through" : ""}>{frag.decision}</span>
                </p>
              )}

              {/* TX hash */}
              {frag.txHash && (
                <p className="absolute bottom-3 left-6 font-mono text-[7px] opacity-20">
                  Grabado en 0G: {frag.txHash.slice(0, 12)}...
                </p>
              )}

              {/* Ruled lines (background) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.06 }}>
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="border-b" style={{ borderColor: "#2a1a0a", height: 32, marginLeft: 30 }} />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 p-4">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          className={`px-4 py-2 text-sm font-body ${page === 0 ? "opacity-20" : "opacity-60 hover:opacity-100"}`} style={{ color: "#2a1a0a" }}>
          ← Anterior
        </button>
        <span className="font-mono text-xs opacity-40">{page + 1} / {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
          className={`px-4 py-2 text-sm font-body ${page >= totalPages - 1 ? "opacity-20" : "opacity-60 hover:opacity-100"}`} style={{ color: "#2a1a0a" }}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export default function DiaryPage() {
  return <Providers><DiaryContent /></Providers>;
}
