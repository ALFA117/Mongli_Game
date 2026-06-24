"use client";

const particles = Array.from({ length: 20 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 1 + Math.random() * 2,
  dur: `${15 + Math.random() * 15}s`,
  delay: `${Math.random() * 10}s`,
  dx: -30 + Math.random() * 60,
  dy: -40 + Math.random() * 20,
}));

export default function FloatingDust() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 6, pointerEvents: "none" }}>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.left, top: p.top,
            width: p.size, height: p.size,
            borderRadius: "50%",
            background: "rgba(232,213,176,0.25)",
            animation: `dust-float ${p.dur} ease-in-out infinite alternate`,
            animationDelay: p.delay,
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes dust-float {
          from { transform: translate(0, 0); opacity: 0.15; }
          to { transform: translate(var(--dx), var(--dy)); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
