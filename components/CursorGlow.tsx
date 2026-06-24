"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 100}px, ${e.clientY - 100}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed", top: 0, left: 0,
        width: 200, height: 200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,0,0,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 9999,
        transition: "transform 0.04s linear",
      }}
    />
  );
}
