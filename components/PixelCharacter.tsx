"use client";

import { useEffect, useRef, useState } from "react";

type CharacterType = "detective" | "shadow" | "witness";

const SPRITES: Record<CharacterType, { draw: (ctx: CanvasRenderingContext2D, frame: number) => void }> = {
  detective: {
    draw: (ctx, frame) => {
      const breathOffset = Math.sin(frame * 0.08) * 0.5;
      ctx.fillStyle = "#1a1a1a";
      // Hat
      ctx.fillRect(8, 2 + breathOffset, 16, 4);
      ctx.fillRect(6, 5 + breathOffset, 20, 3);
      // Head
      ctx.fillStyle = "#d4b896";
      ctx.fillRect(10, 8 + breathOffset, 12, 8);
      // Eyes
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(12, 11 + breathOffset, 3, 2);
      ctx.fillRect(17, 11 + breathOffset, 3, 2);
      ctx.fillStyle = "#000000";
      ctx.fillRect(13, 11 + breathOffset, 1, 2);
      ctx.fillRect(18, 11 + breathOffset, 1, 2);
      // Coat
      ctx.fillStyle = "#333333";
      ctx.fillRect(8, 16 + breathOffset, 16, 10);
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(15, 16 + breathOffset, 1, 10);
      // Legs
      ctx.fillStyle = "#1a1a1a";
      const legOffset = frame % 20 < 10 ? 1 : 0;
      ctx.fillRect(10, 26, 4, 4 + legOffset);
      ctx.fillRect(18, 26, 4, 4 + (1 - legOffset));
    },
  },
  shadow: {
    draw: (ctx, frame) => {
      const flicker = Math.random() > 0.9 ? 0.3 : 1;
      ctx.globalAlpha = 0.7 * flicker;
      // Body - dark mass
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(8, 4, 16, 24);
      ctx.fillRect(6, 8, 20, 16);
      // Eyes - red glow
      const blink = frame % 60 < 55;
      if (blink) {
        ctx.fillStyle = "#ff0000";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 4;
        ctx.fillRect(11, 10, 3, 2);
        ctx.fillRect(18, 10, 3, 2);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    },
  },
  witness: {
    draw: (ctx, frame) => {
      const float = Math.sin(frame * 0.05) * 2;
      // Hood
      ctx.fillStyle = "#c4923a";
      ctx.fillRect(8, 2 + float, 16, 6);
      ctx.fillRect(6, 4 + float, 20, 8);
      // Face shadow
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(10, 6 + float, 12, 6);
      // Eyes glow
      ctx.fillStyle = "#e8d5b0";
      ctx.fillRect(12, 8 + float, 2, 2);
      ctx.fillRect(18, 8 + float, 2, 2);
      // Robe
      ctx.fillStyle = "#8b6914";
      ctx.fillRect(8, 12 + float, 16, 14);
      ctx.fillStyle = "#a07828";
      ctx.fillRect(14, 12 + float, 4, 14);
      // "!" marker
      ctx.fillStyle = "#ff4444";
      ctx.shadowColor = "#ff4444";
      ctx.shadowBlur = 3;
      ctx.fillRect(15, -4 + float, 2, 4);
      ctx.fillRect(15, -6 + float, 2, 1);
      ctx.shadowBlur = 0;
    },
  },
};

interface Props {
  type: CharacterType;
  size?: number;
  className?: string;
}

export default function PixelCharacter({ type, size = 128, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => f + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 32, 32);
    SPRITES[type].draw(ctx, frame);
  }, [frame, type]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
    />
  );
}
