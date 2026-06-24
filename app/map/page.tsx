'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

const LOCS = [
  { id: 0, name: 'LA OFICINA', icon: '🏢', x: 120, y: 60 },
  { id: 1, name: 'EL CALLEJÓN', icon: '🌆', x: 320, y: 100 },
  { id: 2, name: 'LA MORGUE', icon: '⚰️', x: 100, y: 200 },
  { id: 3, name: 'EL BAR ROJO', icon: '🍷', x: 280, y: 220 },
  { id: 4, name: 'LA ESTACIÓN', icon: '🚉', x: 460, y: 160 },
  { id: 5, name: 'EL HOTEL', icon: '🏨', x: 160, y: 320 },
  { id: 6, name: 'EL PUERTO', icon: '⚓', x: 400, y: 340 },
  { id: 7, name: 'EL CEMENTERIO', icon: '☠️', x: 100, y: 430 },
  { id: 8, name: 'LA MANSIÓN', icon: '🏚️', x: 320, y: 440 },
  { id: 9, name: 'EL FARO', icon: '🗼', x: 500, y: 380 },
]

const CONN: Record<number, number[]> = {
  0: [1, 2], 1: [0, 3, 4], 2: [0, 3, 5], 3: [1, 2, 4, 6],
  4: [1, 3, 6], 5: [2, 3, 7], 6: [3, 4, 7, 8, 9], 7: [5, 6, 8], 8: [6, 7, 9], 9: [6, 8],
}

export default function MapPage() {
  const router = useRouter()
  const [playerLoc, setPlayerLoc] = useState(0)
  const [shadowLoc, setShadowLoc] = useState(9)
  const [visited, setVisited] = useState<number[]>([])
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [moving, setMoving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])
  useEffect(() => { const s = localStorage.getItem('mongli_visited'); if (s) try { setVisited(JSON.parse(s)) } catch { /* */ } }, [])

  const moveTo = useCallback((target: number) => {
    if (moving) return
    setMoving(true); setPlayerLoc(target)
    setTimeout(() => setMoving(false), 350)
  }, [moving])

  const investigate = useCallback(() => {
    if (!visited.includes(playerLoc)) {
      const nv = [...visited, playerLoc]; setVisited(nv); localStorage.setItem('mongli_visited', JSON.stringify(nv))
    }
    router.push(`/game?loc=${playerLoc}&lang=${lang}`)
  }, [playerLoc, visited, router, lang])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'e') { investigate(); return }
      const conn = CONN[playerLoc]; const cur = LOCS[playerLoc]
      let best: number | null = null
      conn.forEach(idx => {
        const n = LOCS[idx]; const dx = n.x - cur.x; const dy = n.y - cur.y
        let match = false
        if ((key === 'arrowup' || key === 'w') && dy < -20) match = true
        if ((key === 'arrowdown' || key === 's') && dy > 20) match = true
        if ((key === 'arrowleft' || key === 'a') && dx < -20) match = true
        if ((key === 'arrowright' || key === 'd') && dx > 20) match = true
        if (match) { if (best === null) best = idx; else { const cd = Math.abs(dx) + Math.abs(dy); const bd = Math.abs(LOCS[best].x - cur.x) + Math.abs(LOCS[best].y - cur.y); if (cd < bd) best = idx } }
      })
      if (best !== null) moveTo(best)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playerLoc, investigate, moving, moveTo])

  useEffect(() => {
    const iv = setInterval(() => {
      setShadowLoc(prev => {
        const conn = CONN[prev]; const cur = LOCS[prev]; const player = LOCS[playerLoc]
        let closest = prev; let minDist = Infinity
        conn.forEach(idx => { const n = LOCS[idx]; const dist = Math.hypot(n.x - player.x, n.y - player.y); if (dist < minDist) { minDist = dist; closest = idx } })
        return closest
      })
    }, 10000)
    return () => clearInterval(iv)
  }, [playerLoc])

  const loc = LOCS[playerLoc]
  const scale = isMobile ? Math.min(window.innerWidth / 620, (window.innerHeight - 80) / 520) : 1

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: "'Special Elite', serif", color: '#e8d5b0', overflow: 'hidden' }}>
      <Cursor />

      {/* TOPBAR */}
      <div style={{ flexShrink: 0, height: 48, background: '#080000', borderBottom: '1px solid #2a0000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: '#8B0000', fontSize: 20, cursor: 'none' }}>←</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ color: '#8B0000', fontSize: 18, fontFamily: "'VT323', monospace", letterSpacing: 6, textShadow: '0 0 10px #ff0000' }}>MONGLI</span>
          <span style={{ fontSize: 9, color: '#444', letterSpacing: 3 }}>{lang === 'es' ? `VISITADAS: ${visited.length}/10` : `VISITED: ${visited.length}/10`}</span>
        </div>
        <button onClick={() => setLang(l => l === 'es' ? 'en' : 'es')} style={{ background: 'transparent', border: '1px solid #2a0000', color: '#555', padding: '4px 10px', fontFamily: 'monospace', fontSize: 11, cursor: 'none' }}>{lang === 'es' ? 'EN' : 'ES'}</button>
      </div>

      {/* MAP */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {[0, 1, 2].map(i => <div key={`fog${i}`} style={{ position: 'absolute', width: 250 + i * 100, height: 250 + i * 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.05) 0%, transparent 70%)', left: `${20 + i * 30}%`, top: `${15 + i * 25}%`, transform: 'translate(-50%,-50%)', animation: `fog ${6 + i * 2}s ease-in-out infinite`, pointerEvents: 'none' }} />)}

        <div style={{ position: 'relative', width: 620, height: 520, background: 'linear-gradient(135deg, #0d0005 0%, #050000 50%, #0a0003 100%)', border: '1px solid #2a0010', borderRadius: 8, boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)', flexShrink: 0, transform: isMobile ? `scale(${scale})` : 'none', transformOrigin: 'center center' }}>

          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
            {Object.entries(CONN).flatMap(([from, tos]) => tos.filter(to => to > Number(from)).map(to => {
              const a = LOCS[Number(from)]; const b = LOCS[to]; const done = visited.includes(Number(from)) && visited.includes(to)
              return <line key={`${from}-${to}`} x1={a.x + 30} y1={a.y + 30} x2={b.x + 30} y2={b.y + 30} stroke={done ? '#8B0000' : '#1a0008'} strokeWidth={done ? 2 : 1} strokeDasharray={!done ? '6,6' : ''} opacity={done ? 0.8 : 0.5} />
            }))}
          </svg>

          {LOCS.map(l => {
            const isA = l.id === playerLoc; const isD = visited.includes(l.id); const isS = l.id === shadowLoc
            return (
              <div key={l.id} style={{ position: 'absolute', left: l.x, top: l.y, width: 64, height: 64, background: isA ? 'rgba(139,0,0,0.3)' : isD ? 'rgba(60,30,0,0.4)' : 'rgba(20,0,8,0.6)', border: isA ? '2px solid #ff2200' : isD ? '1px solid #C4923A' : '1px solid #2a0010', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, boxShadow: isA ? '0 0 20px #ff0000, 0 0 40px rgba(139,0,0,0.5)' : isS ? '0 0 15px rgba(255,0,0,0.4)' : 'none', animation: isA ? 'pulse-red 1.5s infinite' : 'none', cursor: 'none', transition: 'all 0.3s' }}>
                <span style={{ fontSize: 24, lineHeight: 1 }}>{l.icon}</span>
                <span style={{ fontSize: 8, color: isA ? '#fff' : '#888', letterSpacing: 1, textAlign: 'center', lineHeight: 1.2 }}>{l.name.split(' ').slice(1).join(' ')}</span>
                {isD && <span style={{ position: 'absolute', top: 2, right: 4, fontSize: 10, color: '#C4923A' }}>✓</span>}
              </div>
            )
          })}

          <div style={{ position: 'absolute', left: loc.x + 12, top: loc.y - 40, fontSize: 32, filter: 'drop-shadow(0 0 8px #ff0000) drop-shadow(0 0 16px #8B0000)', animation: 'float 1.4s ease-in-out infinite', transition: 'left 0.35s cubic-bezier(0.4,0,0.2,1), top 0.35s cubic-bezier(0.4,0,0.2,1)', zIndex: 10, pointerEvents: 'none', transform: moving ? 'rotate(8deg)' : 'rotate(0deg)' }}>🕵️</div>

          {shadowLoc !== playerLoc && (
            <div style={{ position: 'absolute', left: LOCS[shadowLoc].x + 14, top: LOCS[shadowLoc].y - 36, fontSize: 28, filter: 'drop-shadow(0 0 12px #ff0000)', animation: 'float 1s ease-in-out infinite', transition: 'left 0.35s, top 0.35s', zIndex: 9, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.25) 0%, transparent 70%)', top: -10, left: -10, animation: 'pulse-red 1.2s infinite' }} />👤
            </div>
          )}

          {!visited.includes(playerLoc) && (
            <div style={{ position: 'absolute', left: loc.x + 32, top: loc.y - 60, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.95)', border: '1px solid #8B0000', color: '#e8d5b0', padding: '5px 12px', fontSize: 10, letterSpacing: 2, animation: 'blink 1.2s infinite', whiteSpace: 'nowrap', zIndex: 20, borderRadius: 2, transition: 'left 0.35s, top 0.35s' }}>
              [ E ] {lang === 'es' ? 'INVESTIGAR' : 'INVESTIGATE'}
            </div>
          )}
        </div>
      </div>

      {/* Mobile joystick */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 60, left: 16, zIndex: 30 }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(139,0,0,0.15)', border: '1px solid rgba(139,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <button onClick={() => { const c = CONN[playerLoc]; const cur = LOCS[playerLoc]; const t = c.find(i => LOCS[i].y < cur.y - 20); if (t !== undefined) moveTo(t) }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, padding: 4, minWidth: 44, minHeight: 44 }}>▲</button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => { const c = CONN[playerLoc]; const cur = LOCS[playerLoc]; const t = c.find(i => LOCS[i].x < cur.x - 20); if (t !== undefined) moveTo(t) }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, padding: 4, minWidth: 44, minHeight: 44 }}>◄</button>
              <button onClick={investigate} style={{ background: 'none', border: 'none', color: '#C4923A', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold', padding: 4, minWidth: 44, minHeight: 44 }}>E</button>
              <button onClick={() => { const c = CONN[playerLoc]; const cur = LOCS[playerLoc]; const t = c.find(i => LOCS[i].x > cur.x + 20); if (t !== undefined) moveTo(t) }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, padding: 4, minWidth: 44, minHeight: 44 }}>►</button>
            </div>
            <button onClick={() => { const c = CONN[playerLoc]; const cur = LOCS[playerLoc]; const t = c.find(i => LOCS[i].y > cur.y + 20); if (t !== undefined) moveTo(t) }} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 20, padding: 4, minWidth: 44, minHeight: 44 }}>▼</button>
          </div>
        </div>
      )}

      <div style={{ flexShrink: 0, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#333', letterSpacing: 3, borderTop: '1px solid #0a0000' }}>
        {lang === 'es' ? 'WASD / FLECHAS para moverte · E para investigar' : 'WASD / ARROWS to move · E to investigate'}
      </div>
    </div>
  )
}
