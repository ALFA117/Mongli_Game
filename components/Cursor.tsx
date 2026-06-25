"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
  id: number;
}

export default function Cursor() {
  const posRef = useRef({ x: -100, y: -100 });
  const clickingRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [hoverState, setHoverState] = useState<"default" | "locked" | "choice-dark" | "choice-light">("default");
  const trailIdRef = useRef(0);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>(0);
  const trailUpdateRef = useRef(0);

  const updateCursorElements = useCallback(() => {
    if (outerRef.current) {
      outerRef.current.style.left = `${posRef.current.x - 16}px`;
      outerRef.current.style.top = `${posRef.current.y - 16}px`;
      outerRef.current.style.transform = `scale(${clickingRef.current ? 0.8 : 1})`;
    }
    if (innerRef.current) {
      innerRef.current.style.left = `${posRef.current.x - 3}px`;
      innerRef.current.style.top = `${posRef.current.y - 3}px`;
      innerRef.current.style.transform = `scale(${clickingRef.current ? 1.5 : 1})`;
    }
    frameRef.current = requestAnimationFrame(updateCursorElements);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);

      // Trail update — throttled
      const now = Date.now();
      if (now - trailUpdateRef.current > 50) {
        trailUpdateRef.current = now;
        trailIdRef.current++;
        setTrail((prev) => {
          const next = [
            ...prev,
            { x: e.clientX, y: e.clientY, opacity: 0.6, id: trailIdRef.current },
          ].slice(-5);
          return next;
        });
      }

      // Detect hover targets
      const target = e.target as HTMLElement;
      const closestButton = target.closest("button, a, [role='button']");
      if (target.closest("[data-locked]") || (closestButton?.hasAttribute("disabled") && closestButton?.textContent?.includes("?"))) {
        setHoverState("locked");
      } else if (closestButton?.closest("[data-choice-dark]")) {
        setHoverState("choice-dark");
      } else if (closestButton?.closest("[data-choice-light]")) {
        setHoverState("choice-light");
      } else {
        setHoverState("default");
      }
    };

    const down = () => { clickingRef.current = true; };
    const up = () => { clickingRef.current = false; };
    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);

    frameRef.current = requestAnimationFrame(updateCursorElements);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
      cancelAnimationFrame(frameRef.current);
    };
  }, [visible, updateCursorElements]);

  // Fade out trail points
  useEffect(() => {
    if (trail.length === 0) return;
    const timeout = setTimeout(() => {
      setTrail((prev) => prev.filter((p) => p.opacity > 0.05).map((p) => ({ ...p, opacity: p.opacity * 0.6 })));
    }, 80);
    return () => clearTimeout(timeout);
  }, [trail]);

  if (!visible) return null;

  const borderColor =
    hoverState === "locked"
      ? "rgba(120,120,120,0.8)"
      : hoverState === "choice-dark"
      ? "rgba(220,50,50,0.7)"
      : hoverState === "choice-light"
      ? "rgba(196,146,58,0.9)"
      : "rgba(196,146,58,0.8)";

  const dotColor =
    hoverState === "locked"
      ? "#888"
      : hoverState === "choice-dark"
      ? "#dc3232"
      : "#c4923a";

  const pulseAnim =
    hoverState === "choice-dark" || hoverState === "choice-light"
      ? "cursor-pulse 1.2s ease-in-out infinite"
      : "none";

  return (
    <>
      {/* Trail points */}
      {trail.map((point) => (
        <div
          key={point.id}
          className="fixed pointer-events-none z-[9999] rounded-full bg-noir-accent"
          style={{
            left: point.x - 2,
            top: point.y - 2,
            width: 4,
            height: 4,
            opacity: point.opacity,
            transition: "opacity 0.1s",
          }}
        />
      ))}

      {/* Outer ring */}
      <div
        ref={outerRef}
        className="fixed pointer-events-none z-[10000] rounded-full"
        style={{
          width: 32,
          height: 32,
          border: `1px solid ${borderColor}`,
          transition: "border-color 0.2s, transform 0.15s",
          animation: pulseAnim,
        }}
      />

      {/* Inner dot or lock icon */}
      <div
        ref={innerRef}
        className="fixed pointer-events-none z-[10000] flex items-center justify-center"
        style={{
          width: 6,
          height: 6,
          transition: "transform 0.1s",
        }}
      >
        {hoverState === "locked" ? (
          <span className="text-[8px] -ml-[1px] -mt-[1px] select-none" style={{ color: "#888" }}>
            &#128274;
          </span>
        ) : (
          <div
            className="w-full h-full rounded-full"
            style={{ backgroundColor: dotColor }}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes cursor-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </>
  );
}
