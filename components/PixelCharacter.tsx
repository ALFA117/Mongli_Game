"use client";

import { useEffect, useState } from "react";

type CharacterType = "detective" | "shadow" | "witness";

function drawSprite(type: CharacterType): string {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;

  const s = 2; // scale factor (32→64)

  if (type === "detective") {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(8*s, 2*s, 16*s, 4*s);
    ctx.fillRect(6*s, 5*s, 20*s, 3*s);
    ctx.fillStyle = "#d4b896";
    ctx.fillRect(10*s, 8*s, 12*s, 8*s);
    ctx.fillStyle = "#fff";
    ctx.fillRect(12*s, 11*s, 3*s, 2*s);
    ctx.fillRect(17*s, 11*s, 3*s, 2*s);
    ctx.fillStyle = "#000";
    ctx.fillRect(13*s, 11*s, 1*s, 2*s);
    ctx.fillRect(18*s, 11*s, 1*s, 2*s);
    ctx.fillStyle = "#333";
    ctx.fillRect(8*s, 16*s, 16*s, 10*s);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(15*s, 16*s, 1*s, 10*s);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(10*s, 26*s, 4*s, 5*s);
    ctx.fillRect(18*s, 26*s, 4*s, 5*s);
  } else if (type === "shadow") {
    ctx.fillStyle = "#080808";
    ctx.fillRect(6*s, 4*s, 20*s, 24*s);
    ctx.fillRect(4*s, 8*s, 24*s, 16*s);
    ctx.fillStyle = "#ff0000";
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 8;
    ctx.fillRect(11*s, 10*s, 3*s, 2*s);
    ctx.fillRect(18*s, 10*s, 3*s, 2*s);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = "#c4923a";
    ctx.fillRect(8*s, 2*s, 16*s, 6*s);
    ctx.fillRect(6*s, 4*s, 20*s, 8*s);
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(10*s, 6*s, 12*s, 6*s);
    ctx.fillStyle = "#e8d5b0";
    ctx.fillRect(12*s, 8*s, 2*s, 2*s);
    ctx.fillRect(18*s, 8*s, 2*s, 2*s);
    ctx.fillStyle = "#8b6914";
    ctx.fillRect(8*s, 12*s, 16*s, 14*s);
    ctx.fillStyle = "#a07828";
    ctx.fillRect(14*s, 12*s, 4*s, 14*s);
    ctx.fillStyle = "#ff4444";
    ctx.fillRect(15*s, -2*s, 2*s, 4*s);
    ctx.fillRect(15*s, -4*s, 2*s, 1*s);
  }

  return canvas.toDataURL();
}

interface Props {
  type: CharacterType;
  size?: number;
  className?: string;
}

export default function PixelCharacter({ type, size = 128, className = "" }: Props) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    setSrc(drawSprite(type));
  }, [type]);

  if (!src) return <div style={{ width: size, height: size }} />;

  return (
    <img
      src={src}
      alt={type}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: "pixelated" }}
      draggable={false}
    />
  );
}
