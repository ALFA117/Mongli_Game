"use client";

import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const timeRef = useRef(0);
  const rafRef = useRef(0);
  const [tick, setTick] = useState(0);

  const particles = useRef(
    Array.from({ length: 5 }, (_, i) => ({
      angle: (i / 5) * Math.PI * 2,
      dist: 12 + Math.random() * 6,
      size: 1 + Math.random() * 1.5,
    }))
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => { setPos({ x: e.clientX, y: e.clientY }); setVisible(true); };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);

    const animate = () => {
      timeRef.current += 0.03;
      particles.current.forEach((p, i) => { p.angle += 0.04 + i * 0.008; });
      setTick(t => t + 1);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (!visible) return null;

  const sz = clicking ? 10 : 16;
  const glow = clicking ? 8 : 4;

  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, pointerEvents: "none",
      zIndex: 2147483647, transform: "translate(-50%, -50%)", willChange: "transform",
    }}>
      {particles.current.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          left: Math.cos(p.angle) * p.dist,
          top: Math.sin(p.angle) * p.dist,
          width: p.size, height: p.size, borderRadius: "50%",
          background: "#c4923a",
          opacity: 0.4 + Math.sin(p.angle + timeRef.current) * 0.3,
          transform: "translate(-50%, -50%)", filter: "blur(0.5px)",
        }} />
      ))}
      <div style={{
        position: "absolute", width: sz, height: sz,
        border: "1.5px solid #c4923a", borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        filter: `drop-shadow(0 0 ${glow}px #c4923a)`,
        transition: "width 0.1s, height 0.1s", opacity: 0.9,
      }} />
      <div style={{
        position: "absolute", width: 3, height: 3,
        background: "#c4923a", borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        boxShadow: "0 0 4px #c4923a",
      }} />
    </div>
  );
}
