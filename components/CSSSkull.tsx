"use client";

export default function CSSSkull() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ zIndex: 1 }}
    >
      <div style={{
        width: "clamp(200px, 30vw, 350px)",
        height: "clamp(240px, 36vw, 420px)",
        position: "relative",
        animation: "skull-rotate 12s ease-in-out infinite",
        perspective: "800px",
        opacity: 0.2,
      }}>
        {/* Cranium */}
        <div style={{
          position: "absolute", top: 0, left: "10%", width: "80%", height: "65%",
          borderRadius: "50% 50% 45% 45%",
          background: "radial-gradient(ellipse at 40% 40%, #1a0a0a, #050000)",
          boxShadow: "inset 0 0 40px rgba(139,0,0,0.15), 0 0 60px rgba(139,0,0,0.08)",
          animation: "skull-breathe 4s ease-in-out infinite",
        }} />
        {/* Left eye */}
        <div style={{
          position: "absolute", top: "32%", left: "22%", width: "18%", height: "14%",
          borderRadius: "50%", background: "#000",
          boxShadow: "inset 0 0 10px rgba(139,0,0,0.6), 0 0 15px rgba(139,0,0,0.3)",
          animation: "eye-glow 3s ease-in-out infinite",
        }} />
        {/* Right eye */}
        <div style={{
          position: "absolute", top: "32%", right: "22%", width: "18%", height: "14%",
          borderRadius: "50%", background: "#000",
          boxShadow: "inset 0 0 10px rgba(139,0,0,0.6), 0 0 15px rgba(139,0,0,0.3)",
          animation: "eye-glow 3s ease-in-out infinite 0.5s",
        }} />
        {/* Nose */}
        <div style={{
          position: "absolute", top: "50%", left: "42%", width: "16%", height: "10%",
          background: "#030000",
          borderRadius: "20% 20% 50% 50%",
          clipPath: "polygon(30% 0, 70% 0, 100% 100%, 0 100%)",
        }} />
        {/* Jaw */}
        <div style={{
          position: "absolute", bottom: "8%", left: "18%", width: "64%", height: "30%",
          borderRadius: "10% 10% 45% 45%",
          background: "radial-gradient(ellipse at 50% 30%, #120505, #050000)",
          boxShadow: "inset 0 0 20px rgba(139,0,0,0.1)",
        }} />
        {/* Teeth */}
        <div style={{
          position: "absolute", bottom: "28%", left: "30%", width: "40%", height: "6%",
          display: "flex", gap: "2px", justifyContent: "center",
        }}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} style={{
              width: "12%", height: "100%", background: "#1a1210",
              borderRadius: "2px 2px 4px 4px",
            }} />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes skull-rotate {
          0%, 100% { transform: rotateY(-5deg) rotateX(2deg); }
          50% { transform: rotateY(5deg) rotateX(-2deg); }
        }
        @keyframes skull-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.01); }
        }
        @keyframes eye-glow {
          0%, 100% { box-shadow: inset 0 0 10px rgba(139,0,0,0.6), 0 0 15px rgba(139,0,0,0.3); }
          50% { box-shadow: inset 0 0 15px rgba(200,0,0,0.8), 0 0 25px rgba(200,0,0,0.5); }
        }
      `}</style>
    </div>
  );
}
