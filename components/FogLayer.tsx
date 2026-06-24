"use client";

const blobs = [
  { w: 400, h: 300, top: "5%", left: "10%", dur: "6s" },
  { w: 350, h: 250, top: "60%", left: "70%", dur: "8s" },
  { w: 500, h: 400, top: "30%", left: "40%", dur: "5s" },
  { w: 250, h: 200, top: "80%", left: "15%", dur: "7s" },
  { w: 300, h: 350, top: "15%", left: "75%", dur: "9s" },
  { w: 450, h: 300, top: "50%", left: "5%", dur: "6.5s" },
  { w: 200, h: 250, top: "70%", left: "50%", dur: "7.5s" },
  { w: 350, h: 280, top: "40%", left: "25%", dur: "8.5s" },
];

export default function FogLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 1, pointerEvents: "none" }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: b.w, height: b.h,
            top: b.top, left: b.left,
            borderRadius: "50%",
            background: "#8B0000",
            opacity: 0.05,
            filter: "blur(80px)",
            animation: `fog-pulse ${b.dur} ease-in-out infinite alternate`,
            animationDelay: `${i * 0.5}s`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fog-pulse {
          from { transform: translate(-50%, -50%) scale(0.9); opacity: 0.04; }
          to { transform: translate(-50%, -50%) scale(1.1); opacity: 0.07; }
        }
      `}</style>
    </div>
  );
}
