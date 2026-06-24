'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { audioEngine } from '@/lib/audioEngine'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

const LOCATIONS = [
  { id: 0, name: 'Oficina', nameEn: 'Office', icon: '🏢', x: 200, y: 60 },
  { id: 1, name: 'Callejón', nameEn: 'Alley', icon: '🌧️', x: 80, y: 150 },
  { id: 2, name: 'Morgue', nameEn: 'Morgue', icon: '💀', x: 320, y: 150 },
  { id: 3, name: 'Bar', nameEn: 'Bar', icon: '🥃', x: 200, y: 240 },
  { id: 4, name: 'Estación', nameEn: 'Station', icon: '🚂', x: 60, y: 330 },
  { id: 5, name: 'Hotel', nameEn: 'Hotel', icon: '🏨', x: 340, y: 330 },
  { id: 6, name: 'Puerto', nameEn: 'Port', icon: '⚓', x: 120, y: 420 },
  { id: 7, name: 'Cementerio', nameEn: 'Cemetery', icon: '⛪', x: 280, y: 420 },
  { id: 8, name: 'Mansión', nameEn: 'Mansion', icon: '🏚️', x: 200, y: 510 },
  { id: 9, name: 'Faro', nameEn: 'Lighthouse', icon: '🗼', x: 340, y: 510 },
]

const CONNECTIONS: Record<number, number[]> = {
  0: [1, 2], 1: [0, 3, 4], 2: [0, 3, 5], 3: [1, 2, 4, 6],
  4: [1, 3, 6], 5: [2, 3, 7], 6: [3, 4, 7, 9], 7: [5, 6, 8], 8: [7, 9], 9: [6, 8],
}

const CONN_PAIRS: [number, number][] = []
Object.entries(CONNECTIONS).forEach(([from, tos]) => {
  tos.forEach(to => {
    const a = Math.min(+from, to), b = Math.max(+from, to)
    if (!CONN_PAIRS.some(([x, y]) => x === a && y === b)) CONN_PAIRS.push([a, b])
  })
})

const FOG = [
  { left: '10%', top: '20%', w: 250 }, { left: '60%', top: '15%', w: 200 },
  { left: '30%', top: '60%', w: 280 }, { left: '70%', top: '70%', w: 220 },
]

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  return m
}

function useMapScale() {
  const [s, setS] = useState(1)
  useEffect(() => {
    const c = () => setS(Math.min(window.innerWidth / 440, (window.innerHeight - 48) / 600, 1))
    c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c)
  }, [])
  return s
}

export default function MapPage() {
  const router = useRouter()
  const mobile = useIsMobile()
  const scale = useMapScale()
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [playerLoc, setPlayerLoc] = useState(0)
  const [visited, setVisited] = useState<number[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [vol, setVol] = useState(0.4)
  const audioStarted = useRef(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const lastMoveTime = useRef(0)

  useEffect(() => {
    const s = localStorage.getItem('mongli-lang') as 'es' | 'en' | null
    if (s) setLang(s)
    const v = localStorage.getItem('mongli-visited')
    if (v) try { setVisited(JSON.parse(v)) } catch { /* */ }
  }, [])

  const startAudio = useCallback(() => {
    if (audioStarted.current) return
    audioEngine.start(); audioStarted.current = true
  }, [])

  useEffect(() => { if (audioEngine.isRunning()) audioEngine.setVolume(vol) }, [vol])

  const moveTo = useCallback((target: number) => {
    const now = Date.now()
    if (now - lastMoveTime.current < 150) return
    lastMoveTime.current = now
    setPlayerLoc(target)
    setIsMoving(true)
    audioEngine.playGlitch()
    setTimeout(() => setIsMoving(false), 350)
  }, [])

  const investigate = useCallback(() => {
    if (!visited.includes(playerLoc)) {
      const nv = [...visited, playerLoc]
      setVisited(nv)
      localStorage.setItem('mongli-visited', JSON.stringify(nv))
    }
    router.push(`/game?scene=${LOCATIONS[playerLoc].nameEn.toLowerCase()}&lang=${lang}&loc=${playerLoc}`)
  }, [playerLoc, visited, router, lang])

  const moveDir = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const connected = CONNECTIONS[playerLoc]
    const cur = LOCATIONS[playerLoc]
    let target: number | null = null
    for (const idx of connected) {
      const loc = LOCATIONS[idx]
      const fits = (dir === 'up' && loc.y < cur.y) || (dir === 'down' && loc.y > cur.y) || (dir === 'left' && loc.x < cur.x) || (dir === 'right' && loc.x > cur.x)
      if (fits) {
        if (target === null) target = idx
        else {
          const dt = LOCATIONS[target]
          const closer = (dir === 'up' && loc.y > dt.y) || (dir === 'down' && loc.y < dt.y) || (dir === 'left' && loc.x > dt.x) || (dir === 'right' && loc.x < dt.x)
          if (closer) target = idx
        }
      }
    }
    if (target !== null) moveTo(target)
  }, [playerLoc, moveTo])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      startAudio()
      const key = e.key.toLowerCase()
      if (key === 'e') { investigate(); return }
      if (key === 'arrowup' || key === 'w') moveDir('up')
      if (key === 'arrowdown' || key === 's') moveDir('down')
      if (key === 'arrowleft' || key === 'a') moveDir('left')
      if (key === 'arrowright' || key === 'd') moveDir('right')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [investigate, moveDir, startAudio])

  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return
    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    touchStart.current = null
    if (Math.abs(dx) < 25 && Math.abs(dy) < 25) return
    startAudio()
    if (Math.abs(dx) > Math.abs(dy)) moveDir(dx > 0 ? 'right' : 'left')
    else moveDir(dy > 0 ? 'down' : 'up')
  }

  const loc = LOCATIONS[playerLoc]
  const canInvestigate = !visited.includes(playerLoc)
  const iconSize = mobile ? 20 : 28
  const nameSize = mobile ? 9 : 11
  const detectiveSize = mobile ? 28 : 36
  const barH = mobile ? 36 : 48

  return (
    <div onClick={startAudio} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, #1a0008 0%, #000 60%)', overflow: 'hidden', fontFamily: '"Special Elite", Georgia, serif', color: '#e8d5b0', userSelect: 'none' }}>
      <Cursor />

      {FOG.map((f, i) => <div key={`fog${i}`} style={{ position: 'absolute', left: f.left, top: f.top, width: f.w, height: f.w * 0.6, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(139,0,0,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 0 }} />)}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 150px #000, inset 0 0 80px rgba(0,0,0,0.7)', pointerEvents: 'none', zIndex: 1 }} />

      {/* TOPBAR */}
      <div style={{ position: 'relative', zIndex: 20, height: barH, background: '#0a0000', borderBottom: '1px solid #2a0000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <input type="range" min="0" max="1" step="0.01" value={vol} onChange={e => setVol(+e.target.value)} style={{ width: 50, accentColor: '#8B0000' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 8 : 14 }}>
          <span style={{ fontFamily: "var(--font-horror, 'Creepster'), cursive", color: '#cc0000', fontSize: mobile ? 16 : 20, letterSpacing: 3, textShadow: '0 0 10px #ff0000, 0 0 20px #8B0000' }}>MONGLI</span>
          <span style={{ color: '#C4923A', fontSize: 9, fontFamily: 'monospace' }}>{visited.length}/{LOCATIONS.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: '1px solid #2a0000', color: '#666', fontSize: 10, padding: '2px 6px', fontFamily: 'monospace', cursor: 'pointer' }}>←</button>
          <button onClick={e => { e.stopPropagation(); const nl = lang === 'es' ? 'en' : 'es'; setLang(nl); localStorage.setItem('mongli-lang', nl) }} style={{ background: 'transparent', border: '1px solid #2a0000', color: '#666', fontSize: 10, padding: '2px 6px', fontFamily: 'monospace', cursor: 'pointer' }}>{lang.toUpperCase()}</button>
        </div>
      </div>

      {/* MAP */}
      <div style={{ position: 'relative', width: '100%', height: `calc(100vh - ${barH}px)`, overflow: 'hidden', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 420, height: 580, transform: `scale(${scale})`, transformOrigin: 'center center' }}>

          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
            {CONN_PAIRS.map(([a, b]) => {
              const la = LOCATIONS[a], lb = LOCATIONS[b]
              const done = visited.includes(a) || visited.includes(b)
              return <line key={`c${a}-${b}`} x1={la.x + 14} y1={la.y + 14} x2={lb.x + 14} y2={lb.y + 14} stroke={done ? '#8B0000' : '#3a0010'} strokeWidth={done ? 2 : 1} strokeDasharray={done ? '' : '6,4'} opacity={done ? 0.8 : 0.4} />
            })}
          </svg>

          {LOCATIONS.map((l) => {
            const isActive = l.id === playerLoc
            const isVisited = visited.includes(l.id)
            return (
              <div key={l.id} style={{ position: 'absolute', left: l.x - 14, top: l.y - 14, width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 6,
                  background: isActive ? '#3a0000' : isVisited ? '#1a0800' : '#1a0008',
                  border: isActive ? '2px solid #ff2200' : isVisited ? '1px solid #C4923A' : '1px solid #4a0010',
                  boxShadow: isActive ? '0 0 20px #ff0000, 0 0 40px #8B0000' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: iconSize, transition: 'all 0.3s ease',
                  animation: isActive ? 'pulse-red 1.5s infinite' : 'none',
                }}>{l.icon}</div>
                <span style={{ fontSize: nameSize, fontWeight: 'bold', marginTop: 3, color: isActive ? '#ff6644' : isVisited ? '#C4923A' : '#e8d5b0', textShadow: isActive ? '0 0 6px #ff0000' : 'none', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                  {lang === 'es' ? l.name : l.nameEn}
                </span>
                {isVisited && <span style={{ fontSize: 8, color: '#00ff41', fontFamily: 'monospace', marginTop: 1 }}>✓</span>}
              </div>
            )
          })}

          {/* DETECTIVE */}
          <div style={{
            position: 'absolute', left: loc.x - 6, top: loc.y - 50,
            fontSize: detectiveSize, lineHeight: 1, zIndex: 10,
            transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
            filter: 'drop-shadow(0 0 10px #8B0000)',
            animation: 'float 1.5s ease-in-out infinite',
            transform: isMoving ? 'rotate(10deg)' : 'rotate(0deg)',
            willChange: 'transform, left, top',
          }}>🕵️</div>

          {/* Press E */}
          {canInvestigate && (
            <div style={{
              position: 'absolute', left: loc.x + 14, top: loc.y - 80,
              transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.9)',
              border: '1px solid #8B0000', color: '#e8d5b0', padding: '6px 14px',
              fontSize: 11, letterSpacing: 2, animation: 'blink-soft 1.2s ease-in-out infinite',
              whiteSpace: 'nowrap', zIndex: 15, borderRadius: 2,
              boxShadow: '0 0 12px rgba(139,0,0,0.3)',
              transition: 'left 0.35s ease, top 0.35s ease',
              willChange: 'left, top',
            }}>
              {lang === 'es' ? '[ E ] INVESTIGAR' : '[ E ] INVESTIGATE'}
            </div>
          )}
        </div>
      </div>

      {/* Mobile joystick */}
      {mobile && (
        <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 30 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, backdropFilter: 'blur(4px)' }}>
            <button onClick={() => { startAudio(); moveDir('up') }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, lineHeight: 1, padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▲</button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { startAudio(); moveDir('left') }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, lineHeight: 1, padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>◄</button>
              <button onClick={() => { startAudio(); investigate() }} style={{ background: 'none', border: 'none', color: '#C4923A', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>E</button>
              <button onClick={() => { startAudio(); moveDir('right') }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, lineHeight: 1, padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>►</button>
            </div>
            <button onClick={() => { startAudio(); moveDir('down') }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, lineHeight: 1, padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▼</button>
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 12, left: '50%', transform: 'translateX(-50%)', fontSize: 10, color: '#555', fontFamily: 'monospace', letterSpacing: 1, zIndex: 20, animation: 'pulse-text 3s ease-in-out infinite' }}>
        {lang === 'es' ? 'WASD para moverte · E para investigar' : 'WASD to move · E to investigate'}
      </div>

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes blink-soft{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes pulse-red{0%,100%{box-shadow:0 0 12px #ff0000,0 0 24px #8B0000}50%{box-shadow:0 0 24px #ff0000,0 0 48px #8B0000}}
        @keyframes pulse-text{0%,100%{opacity:.5}50%{opacity:1}}
      `}</style>
    </div>
  )
}
