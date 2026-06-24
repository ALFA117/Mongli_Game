"use client";

export default function SVGSkull() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
      <svg width="450" height="500" viewBox="0 0 450 500" fill="none" className="skull-svg" style={{ opacity: 0.3 }}>
        <defs>
          <filter id="skull-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#8B0000" floodOpacity="0.5" />
          </filter>
          <filter id="eye-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff0000" floodOpacity="0.8" />
          </filter>
          <radialGradient id="skull-fill" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#1a1010" />
            <stop offset="100%" stopColor="#080000" />
          </radialGradient>
        </defs>

        {/* Cranium */}
        <ellipse cx="225" cy="180" rx="160" ry="175" fill="url(#skull-fill)" stroke="#8B0000" strokeWidth="1.5" filter="url(#skull-glow)" />

        {/* Temporal bones */}
        <ellipse cx="100" cy="240" rx="45" ry="60" fill="#0f0505" stroke="#8B0000" strokeWidth="0.8" opacity="0.6" />
        <ellipse cx="350" cy="240" rx="45" ry="60" fill="#0f0505" stroke="#8B0000" strokeWidth="0.8" opacity="0.6" />

        {/* Left eye socket */}
        <ellipse cx="170" cy="210" rx="38" ry="32" fill="#000" stroke="#8B0000" strokeWidth="1" filter="url(#eye-glow)">
          <animate attributeName="filter" values="url(#eye-glow);url(#skull-glow);url(#eye-glow)" dur="3s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="170" cy="210" rx="20" ry="16" fill="#1a0000" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
        </ellipse>

        {/* Right eye socket */}
        <ellipse cx="280" cy="210" rx="38" ry="32" fill="#000" stroke="#8B0000" strokeWidth="1" filter="url(#eye-glow)">
          <animate attributeName="filter" values="url(#eye-glow);url(#skull-glow);url(#eye-glow)" dur="3s" repeatCount="indefinite" begin="0.5s" />
        </ellipse>
        <ellipse cx="280" cy="210" rx="20" ry="16" fill="#1a0000" opacity="0.6">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
        </ellipse>

        {/* Brow ridge */}
        <path d="M120 185 Q170 160 225 170 Q280 160 330 185" stroke="#8B0000" strokeWidth="1" fill="none" opacity="0.5" />

        {/* Nose cavity */}
        <path d="M210 260 L225 295 L240 260 Z" fill="#050000" stroke="#8B0000" strokeWidth="0.8" />
        <line x1="225" y1="270" x2="225" y2="290" stroke="#1a0000" strokeWidth="0.5" />

        {/* Cheekbones */}
        <path d="M130 260 Q160 280 190 270" stroke="#8B0000" strokeWidth="0.6" fill="none" opacity="0.4" />
        <path d="M320 260 Q290 280 260 270" stroke="#8B0000" strokeWidth="0.6" fill="none" opacity="0.4" />

        {/* Upper jaw */}
        <path d="M155 310 Q225 330 295 310" stroke="#8B0000" strokeWidth="0.8" fill="none" />

        {/* Teeth */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={163 + i * 16} y={312} width={12} height={20} rx={1}
            fill="#1a1210" stroke="#8B0000" strokeWidth="0.5"
            style={{ filter: "drop-shadow(0 0 2px rgba(139,0,0,0.2))" }}
          />
        ))}

        {/* Lower jaw */}
        <path d="M155 340 Q180 380 225 390 Q270 380 295 340" fill="#0a0505" stroke="#8B0000" strokeWidth="1" opacity="0.7" />

        {/* Jaw joint lines */}
        <line x1="120" y1="280" x2="155" y2="340" stroke="#8B0000" strokeWidth="0.5" opacity="0.3" />
        <line x1="330" y1="280" x2="295" y2="340" stroke="#8B0000" strokeWidth="0.5" opacity="0.3" />

        {/* Cracks */}
        <path d="M200 60 L210 120 L195 160" stroke="#8B0000" strokeWidth="0.6" fill="none" opacity="0.3" />
        <path d="M280 80 L270 130 L285 170" stroke="#8B0000" strokeWidth="0.5" fill="none" opacity="0.25" />
        <path d="M160 140 L175 180" stroke="#8B0000" strokeWidth="0.4" fill="none" opacity="0.2" />
        <path d="M310 150 L295 185" stroke="#8B0000" strokeWidth="0.4" fill="none" opacity="0.2" />

        {/* Crown suture */}
        <path d="M130 130 Q180 110 225 115 Q270 110 320 130" stroke="#8B0000" strokeWidth="0.5" fill="none" opacity="0.2" strokeDasharray="4 3" />
      </svg>

      <style jsx>{`
        .skull-svg {
          animation: skull-pulse 4s ease-in-out infinite alternate;
          transition: opacity 0.3s, filter 0.3s;
        }
        .skull-svg:hover {
          opacity: 0.45 !important;
          filter: drop-shadow(0 0 40px rgba(139,0,0,0.4));
        }
        @keyframes skull-pulse {
          from { filter: drop-shadow(0 0 15px rgba(139,0,0,0.15)); transform: rotateY(-3deg); }
          to { filter: drop-shadow(0 0 25px rgba(139,0,0,0.25)); transform: rotateY(3deg); }
        }
      `}</style>
    </div>
  );
}
