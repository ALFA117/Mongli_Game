"use client";

const particles = Array.from({ length: 30 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 2,
  dur: `${15 + Math.random() * 15}s`,
  delay: `${Math.random() * 10}s`,
  dx: -30 + Math.random() * 60,
  dy: -40 + Math.random() * 20,
  color: i < 8 ? "rgba(139,0,0,0.5)" : "rgba(232,213,176,0.5)",
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
            background: p.color,
            animation: `dust-float-${i % 3} ${p.dur} ease-in-out infinite alternate`,
            animationDelay: p.delay,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes dust-float-0 { from{transform:translate(0,0);opacity:0.3} to{transform:translate(40px,-30px);opacity:0.7} }
        @keyframes dust-float-1 { from{transform:translate(0,0);opacity:0.4} to{transform:translate(-35px,-25px);opacity:0.6} }
        @keyframes dust-float-2 { from{transform:translate(0,0);opacity:0.25} to{transform:translate(25px,-40px);opacity:0.65} }
      `}</style>
    </div>
  );
}
