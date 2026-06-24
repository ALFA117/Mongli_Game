'use client'

export default function SkullHero({ size = 380 }: { size?: number }) {
  const w = size
  const h = size * 1.15
  return (
    <div style={{ width: w, height: h, position: 'relative' }}>
      <svg width={w} height={h} viewBox="0 0 400 460" fill="none" style={{ filter: 'drop-shadow(0 0 20px rgba(139,0,0,0.3))' }}>
        <defs>
          <filter id="skull-glow"><feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#8B0000" floodOpacity="0.5"/></filter>
          <filter id="eye-glow"><feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ff0000" floodOpacity="0.8"/></filter>
          <radialGradient id="skull-grad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#1a1010"/>
            <stop offset="100%" stopColor="#080000"/>
          </radialGradient>
        </defs>

        {/* Cranium */}
        <ellipse cx="200" cy="160" rx="145" ry="155" fill="url(#skull-grad)" stroke="#8B0000" strokeWidth="1.5" filter="url(#skull-glow)"/>

        {/* Temporal bones */}
        <ellipse cx="85" cy="210" rx="40" ry="55" fill="#0f0505" stroke="#8B0000" strokeWidth="0.8" opacity="0.5"/>
        <ellipse cx="315" cy="210" rx="40" ry="55" fill="#0f0505" stroke="#8B0000" strokeWidth="0.8" opacity="0.5"/>

        {/* Brow ridge */}
        <path d="M110 165 Q155 140 200 148 Q245 140 290 165" stroke="#8B0000" strokeWidth="1.2" fill="none" opacity="0.5"/>

        {/* Left eye socket */}
        <ellipse cx="155" cy="190" rx="35" ry="28" fill="#000" stroke="#8B0000" strokeWidth="1" filter="url(#eye-glow)">
          <animate attributeName="filter" values="url(#eye-glow);url(#skull-glow);url(#eye-glow)" dur="3s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="155" cy="190" rx="18" ry="14" fill="#1a0000" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite"/>
        </ellipse>

        {/* Right eye socket */}
        <ellipse cx="245" cy="190" rx="35" ry="28" fill="#000" stroke="#8B0000" strokeWidth="1" filter="url(#eye-glow)">
          <animate attributeName="filter" values="url(#eye-glow);url(#skull-glow);url(#eye-glow)" dur="3s" repeatCount="indefinite" begin="0.5s"/>
        </ellipse>
        <ellipse cx="245" cy="190" rx="18" ry="14" fill="#1a0000" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="2.5s" repeatCount="indefinite" begin="0.5s"/>
        </ellipse>

        {/* Nose cavity */}
        <path d="M188 235 L200 270 L212 235 Z" fill="#050000" stroke="#8B0000" strokeWidth="0.8"/>
        <line x1="200" y1="245" x2="200" y2="265" stroke="#1a0000" strokeWidth="0.5"/>

        {/* Cheekbones */}
        <path d="M110 235 Q145 255 175 245" stroke="#8B0000" strokeWidth="0.6" fill="none" opacity="0.4"/>
        <path d="M290 235 Q255 255 225 245" stroke="#8B0000" strokeWidth="0.6" fill="none" opacity="0.4"/>

        {/* Upper jaw */}
        <path d="M140 285 Q200 305 260 285" stroke="#8B0000" strokeWidth="0.8" fill="none"/>

        {/* Teeth — 8 individual */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={`t${i}`} x={148 + i * 14} y={287} width={10} height={18} rx={1} fill="#1a1210" stroke="#8B0000" strokeWidth="0.5"/>
        ))}

        {/* Lower jaw / mandible */}
        <path d="M140 310 Q165 355 200 365 Q235 355 260 310" fill="#0a0505" stroke="#8B0000" strokeWidth="1" opacity="0.7"/>

        {/* Jaw joint lines */}
        <line x1="105" y1="255" x2="140" y2="310" stroke="#8B0000" strokeWidth="0.5" opacity="0.3"/>
        <line x1="295" y1="255" x2="260" y2="310" stroke="#8B0000" strokeWidth="0.5" opacity="0.3"/>

        {/* Cracks */}
        <path d="M180 50 L190 105 L175 140" stroke="#8B0000" strokeWidth="0.7" fill="none" opacity="0.35"/>
        <path d="M250 65 L240 115 L255 150" stroke="#8B0000" strokeWidth="0.5" fill="none" opacity="0.25"/>
        <path d="M140 120 L155 160" stroke="#8B0000" strokeWidth="0.4" fill="none" opacity="0.2"/>
        <path d="M275 130 L260 165" stroke="#8B0000" strokeWidth="0.4" fill="none" opacity="0.2"/>

        {/* Crown suture */}
        <path d="M115 115 Q160 95 200 100 Q240 95 285 115" stroke="#8B0000" strokeWidth="0.5" fill="none" opacity="0.2" strokeDasharray="4 3"/>

        {/* Blood drops */}
        {[
          { x: 165, y: 320, h: 18 },
          { x: 200, y: 370, h: 22 },
          { x: 235, y: 325, h: 15 },
          { x: 145, y: 295, h: 12 },
          { x: 255, y: 300, h: 14 },
        ].map((d, i) => (
          <g key={`d${i}`}>
            <ellipse cx={d.x} cy={d.y} rx={3} ry={d.h / 2} fill="#8B0000" opacity="0.7">
              <animate attributeName="cy" values={`${d.y};${d.y + 30};${d.y}`} dur={`${3 + i * 0.7}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur={`${3 + i * 0.7}s`} repeatCount="indefinite"/>
            </ellipse>
            <circle cx={d.x} cy={d.y + d.h / 2} r={3.5} fill="#8B0000" opacity="0.5">
              <animate attributeName="cy" values={`${d.y + d.h / 2};${d.y + d.h / 2 + 30};${d.y + d.h / 2}`} dur={`${3 + i * 0.7}s`} repeatCount="indefinite"/>
            </circle>
          </g>
        ))}
      </svg>

      <style>{`
        @keyframes skull-breathe {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(139,0,0,0.2)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 30px rgba(139,0,0,0.4)); transform: scale(1.01); }
        }
      `}</style>
      <div style={{ position: 'absolute', inset: 0, animation: 'skull-breathe 4s ease-in-out infinite', pointerEvents: 'none' }}/>
    </div>
  )
}
