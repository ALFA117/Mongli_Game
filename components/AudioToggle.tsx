"use client";

import { useState, useCallback } from "react";
import { playAmbient, stopAmbient, isAudioStarted, startAudioOnFirstInteraction } from "@/lib/audio";
import { IconVolume, IconVolumeOff } from "./Icons";

export default function AudioToggle({ inline = false }: { inline?: boolean }) {
  const [active, setActive] = useState(false);

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAudioStarted()) {
      await startAudioOnFirstInteraction();
      setActive(true);
      return;
    }
    if (active) { stopAmbient(); setActive(false); }
    else { playAmbient(); setActive(true); }
  }, [active]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={active ? "Silenciar sonido ambiente" : "Activar sonido ambiente"}
      className={
        inline
          ? "flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded border border-noir-border px-3 text-[13px] text-noir-muted transition-colors hover:text-noir-text hover:border-noir-muted"
          : "fixed z-[60] flex h-11 items-center gap-2 rounded border border-noir-border bg-noir-card px-3 text-[13px] text-noir-muted shadow-hard transition-colors hover:text-noir-text hover:border-noir-muted"
      }
      style={inline ? undefined : { right: "max(16px, env(safe-area-inset-right))", bottom: "max(16px, env(safe-area-inset-bottom))" }}
    >
      {active ? <IconVolume size={16} className="text-noir-accent" /> : <IconVolumeOff size={16} />}
      <span className={inline ? "hidden lg:inline" : "hidden sm:inline"}>{active ? "Sonido" : "Sin sonido"}</span>
    </button>
  );
}
