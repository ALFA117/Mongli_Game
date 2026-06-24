'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Cursor from '@/components/Cursor'
import { audioEngine } from '@/lib/audioEngine'

const NODES = 10
const SPEED = 8

const COLORS = { bg: '#000', red: '#8B0000', redB: '#cc0000', amber: '#C4923A', text: '#e8d5b0', muted: '#444', green: '#00ff41', border: '#1a0000' }

const TR = {
  es: {
    fragment: 'FRAGMENTO', acts: ['ACTO I — LA AMNESIA', 'ACTO II — EL DESDOBLAMIENTO', 'ACTO III — LA REVELACIÓN'],
    access: '▶ ACCEDER AL RECUERDO', choose: '— ELIGE TU DESTINO —', stored: '✓ GUARDADO EN 0G',
    loading: ['CONECTANDO A 0G...', 'IA PROCESANDO...', 'RECUPERANDO MEMORIA...'],
    cA: 'Recordar con culpa', cB: 'Olvidar y seguir',
    move: 'WASD o flechas', interact: 'E interactuar', complete: '— FIN DE LA HISTORIA —', waiting: 'UN RECUERDO ESPERA EN ESTE LUGAR',
  },
  en: {
    fragment: 'FRAGMENT', acts: ['ACT I — THE AMNESIA', 'ACT II — THE SPLIT', 'ACT III — THE REVELATION'],
    access: '▶ ACCESS MEMORY', choose: '— CHOOSE YOUR FATE —', stored: '✓ SAVED ON 0G',
    loading: ['CONNECTING TO 0G...', 'AI PROCESSING...', 'RECOVERING MEMORY...'],
    cA: 'Remember with guilt', cB: 'Forget and move on',
    move: 'WASD or arrows', interact: 'E interact', complete: '— END OF STORY —', waiting: 'A MEMORY AWAITS',
  },
}

const NP = [
  { x: 60, y: 40 }, { x: 170, y: 80 }, { x: 80, y: 135 }, { x: 185, y: 180 }, { x: 65, y: 235 },
  { x: 175, y: 280 }, { x: 75, y: 335 }, { x: 185, y: 380 }, { x: 80, y: 430 }, { x: 180, y: 475 },
]

function GameContent() {
  const sp = useSearchParams()
  const il = (sp.get('lang') || 'es') as 'es' | 'en'

  const [lang, setLang] = useState<'es' | 'en'>(il)
  const [pp, setPp] = useState(0)
  const [shP, setShP] = useState(9)
  const [display, setDisplay] = useState('')
  const [typing, setTyping] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lm, setLm] = useState(0)
  const [cA, setCA] = useState('')
  const [cB, setCB] = useState('')
  const [showC, setShowC] = useState(false)
  const [hist, setHist] = useState<string[]>([])
  const [vol, setVol] = useState(0.4)
  const [done, setDone] = useState(false)
  const [hasFrag, setHasFrag] = useState(false)
  const [sHash, setSHash] = useState('')
  const [touchY, setTouchY] = useState<number | null>(null)

  const keysRef = useRef<Set<string>>(new Set())
  const moveRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const typeRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const loadRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const lockRef = useRef(false)

  const t = TR[lang]
  const act = pp < 5 ? 0 : pp < 8 ? 1 : 2

  const startA = useCallback(() => { audioEngine.start(); }, [])

  useEffect(() => { if (audioEngine.isRunning()) audioEngine.setVolume(vol) }, [vol])

  const tw = useCallback((text: string) => {
    if (typeRef.current) clearInterval(typeRef.current)
    setDisplay(''); setTyping(true); setShowC(false)
    let i = 0
    typeRef.current = setInterval(() => {
      if (i < text.length) { setDisplay(text.slice(0, i + 1)); i++ }
      else { if (typeRef.current) clearInterval(typeRef.current); setTyping(false); setShowC(true) }
    }, SPEED)
  }, [])

  const gen = useCallback(async (choice?: string) => {
    if (lockRef.current) return
    lockRef.current = true; startA()
    setLoading(true); setShowC(false); setDisplay(''); setHasFrag(false); setSHash('')
    let mi = 0
    loadRef.current = setInterval(() => { setLm(mi++ % 3) }, 900)
    try {
      const r = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: 'noir city night', history: choice ? [...hist, choice] : hist, fragmentNumber: pp + 1, lang }),
      })
      if (!r.ok) throw new Error('err')
      const data = await r.json()
      const raw: string = data.fragment?.text || data.fragment_text || data.fragment || ''
      const hash: string = data.fragment?.storage_hash || data.storage_hash || ''
      const oA = raw.match(/\[OPCI[ÓO]N A\]:\s*(.+)/i)?.[1]?.trim() || raw.match(/\[OPTION A\]:\s*(.+)/i)?.[1]?.trim() || data.choices?.[0]?.text || t.cA
      const oB = raw.match(/\[OPCI[ÓO]N B\]:\s*(.+)/i)?.[1]?.trim() || raw.match(/\[OPTION B\]:\s*(.+)/i)?.[1]?.trim() || data.choices?.[1]?.text || t.cB
      const clean = raw.replace(/\[OPCI[ÓO]N [AB]\]:.+/gi, '').replace(/\[OPTION [AB]\]:.+/gi, '').trim()
      setCA(oA); setCB(oB); setHasFrag(true); setSHash(hash)
      if (choice) setHist(p => [...p, choice])
      if (pp >= NODES - 1) setDone(true)
      tw(clean)
    } catch { setDisplay('Error...'); setTyping(false) }
    finally { if (loadRef.current) clearInterval(loadRef.current); setLoading(false); lockRef.current = false }
  }, [hist, pp, lang, startA, t.cA, t.cB, tw])

  useEffect(() => {
    const dn = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); keysRef.current.add(k); if (k === 'e' && !typing && !loading && !showC && !lockRef.current) gen() }
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()) }
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up) }
  }, [typing, loading, showC, gen])

  useEffect(() => {
    const tick = () => {
      const k = keysRef.current
      if (k.has('arrowup') || k.has('w')) setPp(p => Math.max(0, p - 1))
      if (k.has('arrowdown') || k.has('s')) setPp(p => Math.min(NODES - 1, p + 1))
      moveRef.current = setTimeout(tick, 200)
    }
    moveRef.current = setTimeout(tick, 200)
    return () => { if (moveRef.current) clearTimeout(moveRef.current) }
  }, [])

  useEffect(() => { const iv = setInterval(() => { setShP(p => Math.max(p - 1, pp + 1)) }, 8000); return () => clearInterval(iv) }, [pp])

  const pick = (o: 'A' | 'B') => {
    const c = o === 'A' ? cA : cB
    setDisplay(''); setShowC(false); setHasFrag(false)
    if (pp < NODES - 1) setPp(p => p + 1)
    gen(c)
  }

  const onTS = (e: React.TouchEvent) => { setTouchY(e.touches[0].clientY) }
  const onTM = (e: React.TouchEvent) => {
    if (touchY === null) return
    const dy = e.touches[0].clientY - touchY
    if (Math.abs(dy) > 30) { setPp(p => dy < 0 ? Math.min(NODES - 1, p + 1) : Math.max(0, p - 1)); setTouchY(e.touches[0].clientY) }
  }
  const onTE = () => { setTouchY(null) }

  return (
    <div onClick={startA} onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
      style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: '"Special Elite", Georgia, serif', color: COLORS.text, overflow: 'hidden', userSelect: 'none' }}>
      <Cursor />

      {/* TOP */}
      <div style={{ flexShrink: 0, height: 48, background: '#050000', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={COLORS.muted} strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <input type="range" min="0" max="1" step="0.01" value={vol} onChange={e => setVol(+e.target.value)} style={{ width: 60, accentColor: COLORS.red }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: COLORS.red, fontSize: 15, letterSpacing: 4, fontWeight: 'bold' }}>MONGLI</span>
          <span style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'monospace' }}>{t.fragment} {String(pp + 1).padStart(2, '0')}/{NODES}</span>
          <span style={{ color: '#2a0000', fontSize: 9 }}>{t.acts[act]}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); setLang(l => l === 'es' ? 'en' : 'es') }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 10, padding: '3px 8px', cursor: 'pointer', fontFamily: 'monospace' }}>{lang.toUpperCase()}</button>
      </div>

      {/* PROGRESS */}
      <div style={{ height: 2, background: '#0a0a0a', flexShrink: 0 }}>
        <div style={{ height: '100%', background: `linear-gradient(to right, ${COLORS.red}, ${COLORS.amber})`, width: `${((pp + 1) / NODES) * 100}%`, transition: 'width 0.6s' }} />
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* MAP */}
        <div style={{ flexShrink: 0, width: 280, background: '#020000', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', paddingTop: 10 }}>
          <div style={{ fontSize: 8, letterSpacing: 3, color: '#2a0000', marginBottom: 3 }}>{t.move}</div>
          <div style={{ fontSize: 7, letterSpacing: 2, color: '#1a0000', marginBottom: 6 }}>{t.interact}</div>
          <svg width="260" height="520" style={{ overflow: 'visible' }}>
            {NP.map((n, i) => {
              if (i === 0) return null
              const p = NP[i - 1]
              return <line key={`l${i}`} x1={p.x} y1={p.y} x2={n.x} y2={n.y} stroke={i <= pp ? COLORS.red : '#111'} strokeWidth={i <= pp ? 1.5 : 1} strokeDasharray={i <= pp ? '' : '4 4'} />
            })}
            {NP.map((n, i) => {
              const isA = i === pp, isD = i < pp, isS = i === shP
              const r = 15
              const pts = Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 180) * (60 * k - 30); return `${n.x + r * Math.cos(a)},${n.y + r * Math.sin(a)}` }).join(' ')
              return (
                <g key={i}>
                  {isA && <circle cx={n.x} cy={n.y} r={24} fill="none" stroke={COLORS.red} strokeWidth={1} opacity={0.3}><animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/></circle>}
                  <polygon points={pts} fill={isA ? COLORS.red : isD ? '#1a0800' : '#0a0a0a'} stroke={isA ? '#ff2200' : isD ? COLORS.red : '#222'} strokeWidth={isA ? 2 : 1}/>
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fill={isD ? COLORS.amber : isA ? '#fff' : '#333'} fontSize="9" fontFamily="monospace">{isD ? '✓' : isA ? '◆' : i + 1}</text>
                  {/* Detective */}
                  {isA && <text x={n.x} y={n.y - 22} textAnchor="middle" fontSize="20" style={{ filter: 'drop-shadow(0 0 6px #8B0000)' }}>🕵️</text>}
                  {/* Witness */}
                  {i === 3 && !isD && <g><text x={n.x} y={n.y - 20} textAnchor="middle" fontSize="16">🧥</text><text x={n.x} y={n.y - 34} textAnchor="middle" fontSize="10" fill={COLORS.amber} fontFamily="monospace" fontWeight="bold">!</text></g>}
                  {/* Shadow */}
                  {isS && <g><circle cx={n.x} cy={n.y - 18} r={14} fill="rgba(139,0,0,0.07)"><animate attributeName="r" values="12;19;12" dur="1.5s" repeatCount="indefinite"/></circle><text x={n.x} y={n.y - 12} textAnchor="middle" fontSize="16">👤</text></g>}
                </g>
              )
            })}
          </svg>
        </div>

        {/* FRAGMENT PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {!hasFrag && !loading && !display && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 11, color: '#2a0000', letterSpacing: 4, textAlign: 'center' }}>{t.waiting}</div>
                <button onClick={e => { e.stopPropagation(); gen() }}
                  style={{ background: 'transparent', border: `1px solid ${COLORS.red}`, color: COLORS.red, padding: '12px 32px', fontFamily: '"Special Elite", serif', fontSize: 13, cursor: 'pointer', letterSpacing: 3, transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = COLORS.red; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.red }}>
                  {t.access}
                </button>
                <div style={{ fontSize: 9, color: '#1a0000', letterSpacing: 2 }}>{t.move} · {t.interact}</div>
              </div>
            )}
            {loading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {t.loading.map((msg, i) => <div key={i} style={{ fontSize: 11, letterSpacing: 2, color: i === lm ? COLORS.red : '#1a0000', transition: 'color 0.5s', fontFamily: 'monospace' }}>{i <= lm ? '▶' : '·'} {msg}</div>)}
              </div>
            )}
            {display && (
              <div style={{ background: '#04000a', border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${COLORS.red}`, padding: '18px 22px', borderRadius: 2 }}>
                <div style={{ fontSize: 9, color: '#2a0000', letterSpacing: 4, marginBottom: 12, fontFamily: 'monospace' }}>[{t.fragment} {String(pp + 1).padStart(2, '0')} / {NODES}]</div>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: COLORS.text, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {display}{typing && <span style={{ color: COLORS.red, animation: 'blink 0.6s infinite' }}>▌</span>}
                </p>
                {!typing && sHash && <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${COLORS.border}`, fontSize: 10, color: COLORS.green, fontFamily: 'monospace', opacity: 0.7 }}>{t.stored} · {sHash.slice(0, 20)}...</div>}
              </div>
            )}
            {done && !typing && <div style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: COLORS.red, letterSpacing: 4 }}>{t.complete}</div>}
          </div>
        </div>
      </div>

      {/* CHOICES */}
      <div style={{ flexShrink: 0, height: showC && !done ? 108 : 0, overflow: 'hidden', transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)', background: '#030000', borderTop: showC ? `1px solid ${COLORS.border}` : 'none' }}>
        <div style={{ height: 108, padding: '10px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#2a0000', letterSpacing: 4 }}>{t.choose}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {([{ o: 'A' as const, l: cA, bc: COLORS.red, hb: COLORS.red }, { o: 'B' as const, l: cB, bc: '#222', hb: '#1a0000' }]).map(({ o, l, bc, hb }) => (
              <button key={o} onClick={e => { e.stopPropagation(); pick(o) }}
                style={{ flex: 1, height: 44, background: 'transparent', border: `1px solid ${bc}`, color: COLORS.text, fontFamily: '"Special Elite", serif', fontSize: 12, cursor: 'pointer', transition: 'all 0.25s', letterSpacing: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = hb; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = COLORS.redB }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text; e.currentTarget.style.borderColor = bc }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile joystick */}
      <div style={{ position: 'fixed', bottom: 120, left: 16, zIndex: 40, display: 'none' }} className="mobile-joy">
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,0,0,0.1)', border: '1px solid rgba(139,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <button onClick={() => setPp(p => Math.max(0, p - 1))} style={{ background: 'none', border: 'none', color: '#8B0000', fontSize: 16 }}>▲</button>
          <div style={{ display: 'flex', gap: 16 }}>
            <button onClick={() => gen()} style={{ background: 'none', border: 'none', color: '#C4923A', fontSize: 10, fontFamily: 'monospace' }}>E</button>
          </div>
          <button onClick={() => setPp(p => Math.min(NODES - 1, p + 1))} style={{ background: 'none', border: 'none', color: '#8B0000', fontSize: 16 }}>▼</button>
        </div>
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#2a0000}
        @media(max-width:768px){.mobile-joy{display:block!important}}
      `}</style>
    </div>
  )
}

export default function GamePage() {
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#000' }}/>}><GameContent /></Suspense>
}
