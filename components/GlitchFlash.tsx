"use client";

import { useEffect, useState } from "react";
import { playGlitchSound } from "@/lib/ambientAudio";

export default function GlitchFlash() {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    function trigger() {
      setFlash(true);
      playGlitchSound();
      setTimeout(() => setFlash(false), 60);
      setTimeout(trigger, 8000 + Math.random() * 12000);
    }
    const t = setTimeout(trigger, 5000 + Math.random() * 5000);
    return () => clearTimeout(t);
  }, []);

  if (!flash) return null;
  return <div className="fixed inset-0 bg-white/5 pointer-events-none" style={{ zIndex: 60 }} />;
}
