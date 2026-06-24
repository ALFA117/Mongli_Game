'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { audioEngine } from '@/lib/audioEngine'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

const NODES = 10
const C = { bg: '#000', red: '#8B0000', redB: '#cc0000', amber: '#C4923A', text: '#f0e0c0', muted: '#666', green: '#00ff41', border: '#2a0000' }

const TR = {
  es: {
    fragment: 'FRAGMENTO', acts: ['ACTO I — LA AMNESIA', 'ACTO II — EL DESDOBLAMIENTO', 'ACTO III — LA REVELACIÓN'],
    access: '▶ ACCEDER AL RECUERDO', choose: '— ELIGE TU DESTINO —', stored: '✓ GUARDADO EN 0G',
    loading: ['CONECTANDO A 0G...', 'IA PROCESANDO...', 'RECUPERANDO MEMORIA...'],
    cA: 'Recordar con culpa', cB: 'Olvidar y seguir', map: 'MAPA DE RECUERDOS',
    move: 'WASD · E interactuar', complete: '— FIN DE LA HISTORIA —', waiting: 'UN RECUERDO ESPERA',
  },
  en: {
    fragment: 'FRAGMENT', acts: ['ACT I — THE AMNESIA', 'ACT II — THE SPLIT', 'ACT III — THE REVELATION'],
    access: '▶ ACCESS MEMORY', choose: '— CHOOSE YOUR FATE —', stored: '✓ SAVED ON 0G',
    loading: ['CONNECTING TO 0G...', 'AI PROCESSING...', 'RECOVERING MEMORY...'],
    cA: 'Remember with guilt', cB: 'Forget and move on', map: 'MEMORY MAP',
    move: 'WASD · E interact', complete: '— END OF STORY —', waiting: 'A MEMORY AWAITS',
  },
}

const NP = [
  { x: 60, y: 30 }, { x: 160, y: 70 }, { x: 60, y: 120 }, { x: 160, y: 160 }, { x: 60, y: 210 },
  { x: 160, y: 250 }, { x: 60, y: 300 }, { x: 160, y: 340 }, { x: 60, y: 390 }, { x: 160, y: 430 },
]

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  return m
}

function GameContent() {
  const sp = useSearchParams()
  const mobile = useIsMobile()
  const [lang, setLang] = useState<'es' | 'en'>((sp.get('lang') || 'es') as 'es' | 'en')
  const [pp, setPp] = useState(0)
  const [shP, setShP] = useState(9)
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

  const textRef = useRef<HTMLParagraphElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const moveRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const typeRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const loadRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const lockRef = useRef(false)
  const fullTextRef = useRef('')

  const t = TR[lang]
  const act = pp < 5 ? 0 : pp < 8 ? 1 : 2

  const startA = useCallback(() => { audioEngine.start() }, [])
  useEffect(() => { if (audioEngine.isRunning()) audioEngine.setVolume(vol) }, [vol])

  const tw = useCallback((text: string) => {
    if (typeRef.current) clearTimeout(typeRef.current)
    fullTextRef.current = text
    setTyping(true); setShowC(false)
    let i = 0
    const tick = () => {
      if (!textRef.current) { typeRef.current = setTimeout(tick, 16); return }
      if (i < text.length) {
        textRef.current.textContent = text.slice(0, ++i) + '▌'
        typeRef.current = setTimeout(tick, 8)
      } else {
        textRef.current.textContent = text
        setTyping(false); setShowC(true)
      }
    }
    tick()
  }, [])

  const gen = useCallback(async (choice?: string) => {
    if (lockRef.current) return
    lockRef.current = true; startA()
    setLoading(true); setShowC(false); setHasFrag(false); setSHash('')
    if (textRef.current) textRef.current.textContent = ''
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
    } catch { if (textRef.current) textRef.current.textContent = 'Error...'; setTyping(false) }
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
      moveRef.current = setTimeout(tick, 150)
    }
    moveRef.current = setTimeout(tick, 150)
    return () => { if (moveRef.current) clearTimeout(moveRef.current) }
  }, [])

  useEffect(() => { const iv = setInterval(() => { setShP(p => Math.max(p - 1, pp + 1)) }, 8000); return () => clearInterval(iv) }, [pp])

  const pick = (o: 'A' | 'B') => { const c = o === 'A' ? cA : cB; if (textRef.current) textRef.current.textContent = ''; setShowC(false); setHasFrag(false); if (pp < NODES - 1) setPp(p => p + 1); gen(c) }

  const barH = mobile ? 36 : 48
  const choiceH = mobile ? 120 : 108

  return (
    <div onClick={startA} style={{ position: 'fixed', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: '"Special Elite", Georgia, serif', color: C.text, overflow: 'hidden', userSelect: 'none' }}>
      <Cursor />

      {/* TOPBAR */}
      <div style={{ flexShrink: 0, height: barH, background: '#0a0000', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <input type="range" min="0" max="1" step="0.01" value={vol} onChange={e => setVol(+e.target.value)} style={{ width: 50, accentColor: C.red }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: mobile ? 6 : 14 }}>
          <span style={{ fontFamily: "var(--font-horror, 'Creepster'), cursive", color: C.redB, fontSize: mobile ? 14 : 20, letterSpacing: 3, textShadow: '0 0 10px #ff0000, 0 0 20px #8B0000' }}>MONGLI</span>
          <span style={{ color: C.amber, fontSize: mobile ? 9 : 11, fontFamily: 'monospace' }}>{t.fragment} {String(pp + 1).padStart(2, '0')}/{NODES}</span>
          {!mobile && <span style={{ color: C.amber, fontSize: 10, textShadow: '0 0 6px rgba(196,146,58,0.4)' }}>{t.acts[act]}</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); setLang(l => l === 'es' ? 'en' : 'es') }} style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontSize: 10, padding: '2px 6px', cursor: 'pointer', fontFamily: 'monospace' }}>{lang.toUpperCase()}</button>
      </div>

      {/* PROGRESS */}
      <div style={{ height: 2, background: '#0a0a0a', flexShrink: 0 }}>
        <div style={{ height: '100%', background: `linear-gradient(to right, ${C.red}, ${C.amber})`, width: `${((pp + 1) / NODES) * 100}%`, transition: 'width 0.6s' }} />
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: mobile ? 'column' : 'row', minHeight: 0 }}>

        {/* MAP sidebar — hidden on mobile */}
        {!mobile && (
          <div style={{ flexShrink: 0, width: 280, background: '#050000', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', padding: '10px 0' }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: C.red, marginBottom: 4, textShadow: '0 0 8px #8B0000' }}>{t.map}</div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: '#555', marginBottom: 8, animation: 'pulse-text 3s ease-in-out infinite' }}>{t.move}</div>
            <div style={{ position: 'relative', width: 240, height: 480, background: 'linear-gradient(180deg, #0a0000 0%, #050000 100%)', border: '1px solid #2a0000', borderRadius: 4, overflow: 'hidden' }}>
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                {NP.map((n, i) => i > 0 && <line key={`ln${i}`} x1={NP[i-1].x+14} y1={NP[i-1].y+14} x2={n.x+14} y2={n.y+14} stroke={i <= pp ? C.red : '#1a1a1a'} strokeWidth={i <= pp ? 2 : 1} strokeDasharray={i <= pp ? '' : '4 4'} />)}
              </svg>
              {NP.map((pos, i) => {
                const isA = i === pp, isD = i < pp
                return <div key={`nd${i}`} style={{ position: 'absolute', left: pos.x, top: pos.y, width: 28, height: 28, borderRadius: 4, background: isA ? '#8B0000' : isD ? '#2a0800' : '#111', border: `1px solid ${isA ? '#ff2200' : isD ? '#8B0000' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: isD ? C.amber : isA ? '#fff' : '#444', fontFamily: 'monospace', boxShadow: isA ? '0 0 12px #ff0000, 0 0 24px #8B0000' : 'none', zIndex: 2 }}>{isD ? '✓' : isA ? '◆' : i+1}</div>
              })}
              <div style={{ position: 'absolute', left: NP[pp].x - 4, top: NP[pp].y - 36, fontSize: 28, lineHeight: 1, zIndex: 5, animation: 'float 1.5s ease-in-out infinite', transition: 'all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)', filter: 'drop-shadow(0 0 8px #8B0000)', willChange: 'transform, left, top' }}>🕵️</div>
              {pp < 3 && <div style={{ position: 'absolute', left: NP[3].x - 4, top: NP[3].y - 38, fontSize: 22, zIndex: 4, animation: 'float 2s ease-in-out infinite' }}><div style={{ fontSize: 10, color: C.amber, textAlign: 'center', fontWeight: 'bold' }}>!</div>🧥</div>}
              {shP < NODES && <div style={{ position: 'absolute', left: NP[Math.min(shP, 9)].x - 4, top: NP[Math.min(shP, 9)].y - 38, fontSize: 22, zIndex: 4, filter: 'drop-shadow(0 0 12px #ff0000)', animation: 'float 1s ease-in-out infinite', transition: 'all 1s ease' }}><div style={{ position: 'absolute', width: 50, height: 50, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.3), transparent 70%)', top: -10, left: -10 }} />👤</div>}
            </div>
          </div>
        )}

        {/* FRAGMENT */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: mobile ? '16px 14px' : '20px 24px' }}>
            {!hasFrag && !loading && !fullTextRef.current && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontSize: 12, color: '#3a0000', letterSpacing: 4, textAlign: 'center' }}>{t.waiting}</div>
                <button onClick={e => { e.stopPropagation(); gen() }}
                  style={{ background: 'transparent', border: `1px solid ${C.red}`, color: C.red, padding: '14px 36px', fontFamily: '"Special Elite", serif', fontSize: 14, cursor: 'pointer', letterSpacing: 3, transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = C.red; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.red }}>
                  {t.access}
                </button>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: 1, animation: 'pulse-text 3s ease-in-out infinite' }}>{t.move}</div>
              </div>
            )}
            {loading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {t.loading.map((msg, i) => <div key={i} style={{ fontSize: 11, letterSpacing: 2, color: i === lm ? C.red : '#1a0000', transition: 'color 0.5s', fontFamily: 'monospace' }}>{i <= lm ? '▶' : '·'} {msg}</div>)}
              </div>
            )}
            {(hasFrag || typing) && (
              <div style={{ background: '#080005', border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.red}`, padding: mobile ? '14px 16px' : '20px 24px', borderRadius: 2 }}>
                <div style={{ fontSize: 11, color: C.red, letterSpacing: 4, marginBottom: 14, fontFamily: 'monospace' }}>[{t.fragment} {String(pp + 1).padStart(2, '0')} / {NODES}]</div>
                <p ref={textRef} style={{ fontSize: mobile ? 14 : 16, lineHeight: 2.0, color: C.text, margin: 0, whiteSpace: 'pre-wrap', minHeight: 60 }} />
                {!typing && sHash && <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.green, fontFamily: 'monospace', textShadow: '0 0 8px #00ff41' }}>{t.stored} · {sHash.slice(0, 20)}...</div>}
              </div>
            )}
            {done && !typing && <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: C.red, letterSpacing: 4 }}>{t.complete}</div>}
          </div>
        </div>
      </div>

      {/* CHOICES */}
      <div style={{ flexShrink: 0, height: showC && !done ? choiceH : 0, overflow: 'hidden', transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)', background: '#030000', borderTop: showC ? `1px solid ${C.border}` : 'none' }}>
        <div style={{ height: choiceH, padding: '10px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#3a0000', letterSpacing: 4 }}>{t.choose}</div>
          <div style={{ display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 8 }}>
            {([{ o: 'A' as const, l: cA, bc: C.red }, { o: 'B' as const, l: cB, bc: '#333' }]).map(({ o, l, bc }) => (
              <button key={o} onClick={e => { e.stopPropagation(); pick(o) }}
                style={{ flex: 1, height: mobile ? 48 : 44, background: 'transparent', border: `1px solid ${bc}`, color: C.text, fontFamily: '"Special Elite", serif', fontSize: 13, cursor: 'pointer', transition: 'all 0.25s', letterSpacing: 1, padding: '12px 20px', minHeight: 44 }}
                onMouseEnter={e => { e.currentTarget.style.background = o === 'A' ? C.red : '#1a0000'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      {mobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 48, background: '#0a0000', borderTop: '1px solid #2a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, zIndex: 30 }}>
          <button onClick={() => setPp(p => Math.max(0, p - 1))} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 22, padding: '8px 16px', minWidth: 44, minHeight: 44 }}>▲</button>
          <button onClick={() => gen()} style={{ background: 'none', border: 'none', color: C.amber, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold', padding: '8px 16px', minWidth: 44, minHeight: 44 }}>E</button>
          <button onClick={() => setPp(p => Math.min(NODES - 1, p + 1))} style={{ background: 'none', border: 'none', color: '#cc0000', fontSize: 22, padding: '8px 16px', minWidth: 44, minHeight: 44 }}>▼</button>
        </div>
      )}

      <style>{`
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        @keyframes pulse-text{0%,100%{opacity:.5}50%{opacity:1}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#2a0000}
      `}</style>
    </div>
  )
}

export default function GamePage() {
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#000' }}/>}><GameContent /></Suspense>
}
