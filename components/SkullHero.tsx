'use client'

export default function SkullHero({ size = 480 }: { size?: number }) {
  const w = size
  const h = size * 1.1
  return (
    <div style={{ width: w, height: h, position: 'relative' }}>
      <svg width={w} height={h} viewBox="0 0 400 440" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="skullGlow"><feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#8B0000" floodOpacity="0.6"/></filter>
          <filter id="eyeGlow"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <radialGradient id="skullBg" cx="50%" cy="50%"><stop offset="0%" stopColor="#8B0000" stopOpacity="0.35"/><stop offset="55%" stopColor="#8B0000" stopOpacity="0.08"/><stop offset="100%" stopColor="#000" stopOpacity="0"/></radialGradient>
          <radialGradient id="skullFill" cx="50%" cy="40%" r="50%"><stop offset="0%" stopColor="#1a1010"/><stop offset="100%" stopColor="#080000"/></radialGradient>
        </defs>

        {/* Background glow */}
        <ellipse cx="200" cy="210" rx="180" ry="200" fill="url(#skullBg)"/>

        {/* Cranium */}
        <ellipse cx="200" cy="155" rx="148" ry="150" fill="url(#skullFill)" stroke="#8B0000" strokeWidth="1.5" filter="url(#skullGlow)"/>

        {/* Temporal bones */}
        <ellipse cx="82" cy="205" rx="38" ry="52" fill="#0f0505" stroke="#8B0000" strokeWidth="0.8" opacity="0.5"/>
        <ellipse cx="318" cy="205" rx="38" ry="52" fill="#0f0505" stroke="#8B0000" strokeWidth="0.8" opacity="0.5"/>

        {/* Brow ridge */}
        <path d="M108 162 Q155 138 200 145 Q245 138 292 162" stroke="#8B0000" strokeWidth="1.2" fill="none" opacity="0.5"/>

        {/* Left eye */}
        <ellipse cx="152" cy="185" rx="36" ry="30" fill="#000" stroke="#8B0000" strokeWidth="1.2"/>
        <ellipse cx="152" cy="185" rx="20" ry="16" fill="#ff0000" opacity="0.15" filter="url(#eyeGlow)">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite"/>
        </ellipse>
        <ellipse cx="152" cy="185" rx="10" ry="8" fill="#ff0000" opacity="0.4" filter="url(#eyeGlow)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="fill" values="#ff0000;#ff4400;#ff0000" dur="3s" repeatCount="indefinite"/>
        </ellipse>

        {/* Right eye */}
        <ellipse cx="248" cy="185" rx="36" ry="30" fill="#000" stroke="#8B0000" strokeWidth="1.2"/>
        <ellipse cx="248" cy="185" rx="20" ry="16" fill="#ff0000" opacity="0.15" filter="url(#eyeGlow)">
          <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite" begin="0.4s"/>
        </ellipse>
        <ellipse cx="248" cy="185" rx="10" ry="8" fill="#ff0000" opacity="0.4" filter="url(#eyeGlow)">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" begin="0.4s"/>
          <animate attributeName="fill" values="#ff0000;#ff4400;#ff0000" dur="3s" repeatCount="indefinite" begin="0.4s"/>
        </ellipse>

        {/* Nose cavity */}
        <path d="M186 232 L200 268 L214 232 Z" fill="#050000" stroke="#8B0000" strokeWidth="0.8"/>
        <line x1="200" y1="242" x2="200" y2="262" stroke="#1a0000" strokeWidth="0.5"/>

        {/* Cheekbones */}
        <path d="M108 232 Q142 252 172 242" stroke="#8B0000" strokeWidth="0.7" fill="none" opacity="0.4"/>
        <path d="M292 232 Q258 252 228 242" stroke="#8B0000" strokeWidth="0.7" fill="none" opacity="0.4"/>

        {/* Upper jaw */}
        <path d="M138 280 Q200 300 262 280" stroke="#8B0000" strokeWidth="0.8" fill="none"/>

        {/* Teeth */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={`t${i}`} x={146 + i * 14} y={282} width={11} height={19} rx={1} fill="#1a1210" stroke="#8B0000" strokeWidth="0.5"/>
        ))}

        {/* Mandible */}
        <path d="M138 306 Q168 350 200 358 Q232 350 262 306" fill="#0a0505" stroke="#8B0000" strokeWidth="1" opacity="0.7"/>

        {/* Jaw joints */}
        <line x1="102" y1="250" x2="138" y2="306" stroke="#8B0000" strokeWidth="0.5" opacity="0.3"/>
        <line x1="298" y1="250" x2="262" y2="306" stroke="#8B0000" strokeWidth="0.5" opacity="0.3"/>

        {/* Cracks */}
        <path d="M178 45 L188 100 L173 138" stroke="#8B0000" strokeWidth="0.7" fill="none" opacity="0.35"/>
        <path d="M248 60 L238 112 L253 148" stroke="#8B0000" strokeWidth="0.5" fill="none" opacity="0.25"/>
        <path d="M138 118 L153 158" stroke="#8B0000" strokeWidth="0.4" fill="none" opacity="0.2"/>
        <path d="M278 128 L263 162" stroke="#8B0000" strokeWidth="0.4" fill="none" opacity="0.2"/>

        {/* Crown suture */}
        <path d="M112 110 Q158 90 200 96 Q242 90 288 110" stroke="#8B0000" strokeWidth="0.5" fill="none" opacity="0.2" strokeDasharray="4 3"/>

        {/* Blood drops — 8 large with tails */}
        {[
          { x: 158, y: 310, h: 22, d: 3.2 },
          { x: 200, y: 362, h: 28, d: 3.8 },
          { x: 240, y: 315, h: 20, d: 3.5 },
          { x: 138, y: 290, h: 16, d: 4.0 },
          { x: 262, y: 295, h: 18, d: 3.0 },
          { x: 175, y: 340, h: 24, d: 4.5 },
          { x: 225, y: 345, h: 20, d: 3.3 },
          { x: 190, y: 300, h: 14, d: 3.7 },
        ].map((d, i) => (
          <g key={`bd${i}`}>
            <rect x={d.x - 1} y={d.y - 8} width={2} height={15} fill="#cc0000" opacity="0.4" rx="1">
              <animate attributeName="y" values={`${d.y - 8};${d.y + 20};${d.y - 8}`} dur={`${d.d}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur={`${d.d}s`} repeatCount="indefinite"/>
            </rect>
            <ellipse cx={d.x} cy={d.y} rx={4 + (i % 3)} ry={d.h / 2} fill="#cc0000" opacity="0.65">
              <animate attributeName="cy" values={`${d.y};${d.y + 35};${d.y}`} dur={`${d.d}s`} repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.65;0.15;0.65" dur={`${d.d}s`} repeatCount="indefinite"/>
            </ellipse>
            <circle cx={d.x} cy={d.y + d.h / 2} r={4 + (i % 2)} fill="#cc0000" opacity="0.45">
              <animate attributeName="cy" values={`${d.y + d.h / 2};${d.y + d.h / 2 + 35};${d.y + d.h / 2}`} dur={`${d.d}s`} repeatCount="indefinite"/>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  )
}
