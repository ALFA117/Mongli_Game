"use client";

export default function CSSSkull() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      <div className="skull-wrap" style={{ width: 300, height: 350, position: "relative", opacity: 0.25 }}>
        {/* Cranium */}
        <div style={{
          position: "absolute", top: 0, left: "8%", width: "84%", height: "62%",
          borderRadius: "50% 50% 42% 42%",
          background: "radial-gradient(ellipse at 40% 35%, #1a0808, #040000)",
          boxShadow: "inset 0 0 50px rgba(139,0,0,0.15), 0 0 80px rgba(139,0,0,0.08)",
        }} />
        {/* Left eye */}
        <div className="skull-eye" style={{ position: "absolute", top: "30%", left: "20%", width: "20%", height: "15%", borderRadius: "50%", background: "#000" }} />
        {/* Right eye */}
        <div className="skull-eye" style={{ position: "absolute", top: "30%", right: "20%", width: "20%", height: "15%", borderRadius: "50%", background: "#000", animationDelay: "0.5s" }} />
        {/* Nose */}
        <div style={{
          position: "absolute", top: "50%", left: "40%", width: "20%", height: "10%",
          background: "#020000", clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)",
        }} />
        {/* Jaw */}
        <div style={{
          position: "absolute", bottom: "6%", left: "15%", width: "70%", height: "30%",
          borderRadius: "8% 8% 45% 45%",
          background: "radial-gradient(ellipse at 50% 25%, #100404, #040000)",
          boxShadow: "inset 0 0 25px rgba(139,0,0,0.08)",
        }} />
        {/* Teeth */}
        <div style={{
          position: "absolute", bottom: "26%", left: "28%", width: "44%", height: "7%",
          display: "flex", gap: 3, justifyContent: "center",
        }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{ width: 15, height: "100%", background: "#1a1210", borderRadius: "0 0 4px 4px" }} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .skull-wrap {
          animation: skull-sway 4s ease-in-out infinite alternate;
          transition: transform 0.3s, filter 0.3s;
        }
        .skull-wrap:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 0 30px rgba(139,0,0,0.3));
        }
        .skull-eye {
          box-shadow: inset 0 0 12px rgba(200,0,0,0.7), 0 0 20px rgba(200,0,0,0.3);
          animation: eye-flicker 3s ease-in-out infinite;
        }
        @keyframes skull-sway {
          from { transform: rotateY(-5deg) rotateX(2deg); }
          to { transform: rotateY(5deg) rotateX(-2deg); }
        }
        @keyframes eye-flicker {
          0%, 85%, 100% { box-shadow: inset 0 0 12px rgba(200,0,0,0.7), 0 0 20px rgba(200,0,0,0.3); }
          88% { box-shadow: inset 0 0 4px rgba(100,0,0,0.2), 0 0 5px rgba(100,0,0,0.1); }
          91% { box-shadow: inset 0 0 15px rgba(255,0,0,0.9), 0 0 30px rgba(255,0,0,0.5); }
        }
      `}</style>
    </div>
  );
}
