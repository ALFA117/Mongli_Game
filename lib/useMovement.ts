"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Position { x: number; y: number; }

export function useMovement(bounds: { minX: number; maxX: number; minY: number; maxY: number }) {
  const [pos, setPos] = useState<Position>({ x: 0, y: 0 });
  const keysRef = useRef(new Set<string>());
  const mobileRef = useRef<Position>({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); };
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    const speed = 3;
    const tick = () => {
      const keys = keysRef.current;
      let dx = 0, dy = 0;

      if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
      if (keys.has("arrowright") || keys.has("d")) dx += 1;
      if (keys.has("arrowup") || keys.has("w")) dy -= 1;
      if (keys.has("arrowdown") || keys.has("s")) dy += 1;

      dx += mobileRef.current.x;
      dy += mobileRef.current.y;

      if (dx !== 0 || dy !== 0) {
        setPos((p) => ({
          x: Math.max(bounds.minX, Math.min(bounds.maxX, p.x + dx * speed)),
          y: Math.max(bounds.minY, Math.min(bounds.maxY, p.y + dy * speed)),
        }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, [bounds.minX, bounds.maxX, bounds.minY, bounds.maxY]);

  const onMobileMove = useCallback((dx: number, dy: number) => {
    mobileRef.current = { x: dx, y: dy };
  }, []);

  const onMobileStop = useCallback(() => {
    mobileRef.current = { x: 0, y: 0 };
  }, []);

  return { pos, onMobileMove, onMobileStop };
}

export function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(/iPhone|iPad|Android/i.test(navigator.userAgent));
  }, []);
  return mobile;
}
