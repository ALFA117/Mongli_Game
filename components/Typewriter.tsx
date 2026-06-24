"use client";

import { useState, useEffect } from "react";

interface Props {
  text: string;
  delay?: number;
  startDelay?: number;
}

export default function Typewriter({ text, delay = 70, startDelay = 2000 }: Props) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timeout);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, delay);

    return () => clearInterval(interval);
  }, [started, text, delay]);

  return (
    <p className="font-mono text-sm sm:text-base text-red-200/60 max-w-lg mx-auto leading-relaxed h-12">
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse text-red-500">|</span>
      )}
    </p>
  );
}
