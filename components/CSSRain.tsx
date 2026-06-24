"use client";

const drops = Array.from({ length: 20 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  height: `${10 + Math.random() * 25}px`,
  duration: `${0.5 + Math.random() * 1.5}s`,
  delay: `${Math.random() * 2}s`,
  opacity: 0.15 + Math.random() * 0.25,
}));

export default function CSSRain() {
  return (
    <div className="rain-container" style={{ position: "absolute", inset: 0, zIndex: 1 }}>
      {drops.map((d, i) => (
        <div
          key={i}
          className="raindrop"
          style={{
            left: d.left,
            height: d.height,
            animationDuration: d.duration,
            animationDelay: d.delay,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}
