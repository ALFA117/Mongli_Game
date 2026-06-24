"use client";

import { useRef, useCallback } from "react";

interface Props {
  onMove: (dx: number, dy: number) => void;
  onStop: () => void;
}

export default function MobileJoystick({ onMove, onStop }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const startRef = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - startRef.current.x;
    const dy = touch.clientY - startRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 30;
    const clampedDist = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const cx = Math.cos(angle) * clampedDist;
    const cy = Math.sin(angle) * clampedDist;

    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
    }

    if (dist > 5) {
      onMove(dx / dist, dy / dist);
    }
  }, [onMove]);

  const handleEnd = useCallback(() => {
    if (thumbRef.current) {
      thumbRef.current.style.transform = "translate(-50%, -50%)";
    }
    onStop();
  }, [onStop]);

  return (
    <div
      ref={baseRef}
      className="joystick-base"
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
    >
      <div ref={thumbRef} className="joystick-thumb" />
    </div>
  );
}
