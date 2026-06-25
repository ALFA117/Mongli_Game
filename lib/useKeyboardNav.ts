"use client";

import { useEffect, useCallback } from "react";

interface KeyboardNavOptions {
  onLeft?: () => void;
  onRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onDigit?: (n: number) => void;
  enabled?: boolean;
}

export function useKeyboardNav({
  onLeft,
  onRight,
  onEnter,
  onEscape,
  onDigit,
  enabled = true,
}: KeyboardNavOptions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          onLeft?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          onRight?.();
          break;
        case "Enter":
          onEnter?.();
          break;
        case "Escape":
          onEscape?.();
          break;
        default:
          if (e.key >= "1" && e.key <= "9") {
            onDigit?.(parseInt(e.key, 10));
          }
          break;
      }
    },
    [onLeft, onRight, onEnter, onEscape, onDigit, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
