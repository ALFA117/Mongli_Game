"use client";

import { useState, useEffect, useCallback } from "react";

type SceneType = "hotel" | "alley" | "office" | "void" | "archive";

interface Skull3DProps {
  scene?: SceneType;
  className?: string;
  onSkullClick?: () => void;
}

const SCENE_OVERLAYS: Record<SceneType, string> = {
  hotel: "rgba(196,146,58,0.2)",
  alley: "rgba(48,96,176,0.2)",
  office: "rgba(0,255,65,0.15)",
  void: "rgba(0,0,0,0.4)",
  archive: "rgba(139,90,43,0.2)",
};

const EMBED_URL =
  "https://sketchfab.com/models/a04a252f8376401bad417f0d9f263b2a/embed?autostart=1&ui_hint=0&ui_infos=0&ui_watermark=0&ui_watermark_link=0&ui_ar=0&ui_help=0&ui_settings=0&ui_vr=0&ui_fullscreen=0&ui_annotations=0&transparent=1&autospin=0.3&preload=1";

export default function Skull3D({ scene = "hotel", className = "", onSkullClick }: Skull3DProps) {
  const [loaded, setLoaded] = useState(false);
  const overlay = SCENE_OVERLAYS[scene];

  const handleClick = useCallback(() => {
    onSkullClick?.();
  }, [onSkullClick]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ minWidth: 150, minHeight: 150 }}
      onClick={handleClick}
    >
      {/* Loading skeleton */}
      {!loaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: "#0d0d0d" }}
        >
          <div
            className="w-16 h-16 rounded-full animate-pulse"
            style={{ border: "1px solid rgba(196,146,58,0.2)" }}
          />
        </div>
      )}

      {/* Sketchfab iframe */}
      <iframe
        src={EMBED_URL}
        title="Mongli - Calavera 3D"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        onLoad={() => setLoaded(true)}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
          display: loaded ? "block" : "none",
        }}
      />

      {/* Scene color overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: overlay,
          mixBlendMode: "color",
        }}
      />

      {/* Cover Sketchfab attribution at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: 40, background: "#0a0a0a" }}
      />
    </div>
  );
}
