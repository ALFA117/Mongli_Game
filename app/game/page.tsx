'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

const LOCS = [
  { id: 0, name: 'LA OFICINA', icon: '🏢', desc: 'Papeles. Polvo. Tu nombre en el escritorio.' },
  { id: 1, name: 'EL CALLEJÓN', icon: '🌆', desc: 'Lluvia. Sangre vieja en el asfalto.' },
  { id: 2, name: 'LA MORGUE', icon: '⚰️', desc: 'Frío. Olor a formol. Una camilla vacía.' },
  { id: 3, name: 'EL BAR ROJO', icon: '🍷', desc: 'Jazz. Humo. Alguien te conoce aquí.' },
  { id: 4, name: 'LA ESTACIÓN', icon: '🚉', desc: 'Trenes que nunca llegan. Taquillas cerradas.' },
  { id: 5, name: 'EL HOTEL', icon: '🏨', desc: 'Habitación 114. La llave encaja.' },
  { id: 6, name: 'EL PUERTO', icon: '⚓', desc: 'Barcos oxidados. Cajas sin marcar.' },
  { id: 7, name: 'EL CEMENTERIO', icon: '☠️', desc: 'Una lápida con tu fecha de nacimiento.' },
  { id: 8, name: 'LA MANSIÓN', icon: '🏚️', desc: 'Puertas sin cerrar. Retratos sin caras.' },
  { id: 9, name: 'EL FARO', icon: '🗼', desc: 'La luz gira. Algo espera arriba.' },
]

function GameContent() {
  const router = useRouter()
  const params = useSearchParams()
  const locId = parseInt(params.get('loc') || '0')
  const lang = (params.get('lang') || 'es') as 'es' | 'en'
  const loc = LOCS[locId] || LOCS[0]

  const [fragNum, setFragNum] = useState(1)
  const [display, setDisplay] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [choiceA, setChoiceA] = useState('')
  const [choiceB, setChoiceB] = useState('')
  const [showChoices, setShowChoices] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const typeRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])

  const typeWriter = useCallback((text: string) => {
    clearTimeout(typeRef.current)
    setIsTyping(true); setShowChoices(false); setDisplay('')
    let i = 0
    const tick = () => {
      if (i < text.length) { setDisplay(text.slice(0, ++i)); typeRef.current = setTimeout(tick, 10) }
      else { setIsTyping(false); setShowChoices(true) }
    }
    tick()
  }, [])

  const generateFragment = useCallback(async (choice?: string) => {
    if (isLoading || isTyping) return
    setIsLoading(true); setShowChoices(false); setDisplay('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: loc.name, desc: loc.desc, history: choice ? [...history, choice] : history, fragmentNumber: fragNum, lang }),
      })
      const data = await res.json()
      const raw: string = data.fragment?.text || data.fragment_text || data.fragment || 'Error.'
      const optA = raw.match(/\[OPCI[ÓO]N A\]:\s*(.+)/i)?.[1]?.trim() || raw.match(/\[OPTION A\]:\s*(.+)/i)?.[1]?.trim() || (lang === 'es' ? 'Recordar' : 'Remember')
      const optB = raw.match(/\[OPCI[ÓO]N B\]:\s*(.+)/i)?.[1]?.trim() || raw.match(/\[OPTION B\]:\s*(.+)/i)?.[1]?.trim() || (lang === 'es' ? 'Olvidar' : 'Forget')
      const clean = raw.replace(/\[OPCI[ÓO]N [AB]\]:.+/gi, '').replace(/\[OPTION [AB]\]:.+/gi, '').trim()
      setChoiceA(optA); setChoiceB(optB)
      if (choice) setHistory(h => [...h, choice])
      typeWriter(clean)
    } catch { setDisplay('Error de conexión...'); setIsTyping(false) }
    finally { setIsLoading(false) }
  }, [isLoading, isTyping, loc, history, fragNum, lang, typeWriter])

  const handleChoice = (opt: 'A' | 'B') => {
    const chosen = opt === 'A' ? choiceA : choiceB
    if (fragNum >= 3) {
      const saved = JSON.parse(localStorage.getItem('mongli_visited') || '[]')
      if (!saved.includes(locId)) localStorage.setItem('mongli_visited', JSON.stringify([...saved, locId]))
      setDone(true)
      setTimeout(() => router.push('/map'), 2500)
    } else { setFragNum(n => n + 1); setShowChoices(false); generateFragment(chosen) }
  }

  const T = { es: { investigate: 'INVESTIGAR', back: '← MAPA', loading: 'RECUPERANDO MEMORIA...', choose: '— ELIGE —', stored: 'GUARDADO EN 0G', done: 'Memoria recuperada. Volviendo al mapa...' }, en: { investigate: 'INVESTIGATE', back: '← MAP', loading: 'RECOVERING MEMORY...', choose: '— CHOOSE —', stored: 'SAVED ON 0G', done: 'Memory recovered. Returning to map...' } }[lang]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: "'Special Elite', serif", color: '#e8d5b0', overflow: 'hidden' }}>
      <Cursor />

      {/* TOPBAR */}
      <div style={{ flexShrink: 0, height: 48, background: '#060000', borderBottom: '1px solid #2a0000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 12 }}>
        <button onClick={() => router.push('/map')} style={{ background: 'transparent', border: '1px solid #2a0000', color: '#8B0000', padding: '6px 14px', fontFamily: "'Special Elite', serif", fontSize: 12, cursor: 'none', letterSpacing: 2 }}>{T.back}</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#8B0000', letterSpacing: 2 }}>{loc.icon} {loc.name}</span>
          <span style={{ fontSize: 9, color: '#C4923A', letterSpacing: 2 }}>{lang === 'es' ? 'FRAGMENTO' : 'FRAGMENT'} {fragNum}/3</span>
        </div>
        <span style={{ fontSize: 9, color: '#333', letterSpacing: 2, fontFamily: 'monospace' }}>0G · GALILEO</span>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0, overflow: 'hidden' }}>
        {/* Sidebar */}
        {!isMobile && (
          <div style={{ flexShrink: 0, width: 220, background: '#040000', borderRight: '1px solid #1a0000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
            <div style={{ fontSize: 72, filter: 'drop-shadow(0 0 20px #8B0000)' }}>{loc.icon}</div>
            <div style={{ fontSize: 14, color: '#8B0000', textAlign: 'center', letterSpacing: 2, textShadow: '0 0 8px #8B0000' }}>{loc.name}</div>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(to right, transparent, #8B0000, transparent)' }} />
            <div style={{ fontSize: 11, color: '#555', textAlign: 'center', lineHeight: 1.6, fontStyle: 'italic' }}>{loc.desc}</div>
            <div style={{ width: '100%', marginTop: 8 }}>
              <div style={{ fontSize: 9, color: '#333', letterSpacing: 2, marginBottom: 6 }}>{lang === 'es' ? 'PROGRESO' : 'PROGRESS'}</div>
              <div style={{ width: '100%', height: 2, background: '#1a0000', borderRadius: 1 }}><div style={{ width: `${((fragNum - 1) / 3) * 100}%`, height: '100%', background: '#8B0000', borderRadius: 1, transition: 'width 0.5s' }} /></div>
            </div>
          </div>
        )}

        {/* Fragment */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 16px' : '28px 32px' }}>
            {!display && !isLoading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ fontSize: 72, marginBottom: 8, filter: 'drop-shadow(0 0 20px #8B0000)', animation: 'float 2s ease-in-out infinite' }}>{loc.icon}</div>
                <div style={{ fontSize: 11, color: '#2a0000', letterSpacing: 4, textAlign: 'center' }}>{loc.desc}</div>
                <button onClick={() => generateFragment()} style={{ background: 'transparent', border: '1px solid #8B0000', color: '#8B0000', padding: '14px 36px', fontFamily: "'Special Elite', serif", fontSize: 13, cursor: 'none', letterSpacing: 3, animation: 'pulse-red 2s infinite', transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#8B0000'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8B0000' }}>
                  {T.investigate} →
                </button>
              </div>
            )}

            {isLoading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontSize: 72, opacity: 0.3, animation: 'float 1s ease-in-out infinite' }}>{loc.icon}</div>
                <div style={{ fontSize: 11, color: '#8B0000', letterSpacing: 4, animation: 'blink 0.8s infinite' }}>{T.loading}</div>
              </div>
            )}

            {display && !done && (
              <div style={{ background: '#05000a', border: '1px solid #1a0000', borderLeft: '3px solid #8B0000', padding: isMobile ? 16 : '24px 28px', borderRadius: 2 }}>
                <div style={{ fontSize: 9, color: '#2a0000', letterSpacing: 4, marginBottom: 16, fontFamily: 'monospace' }}>[{lang === 'es' ? 'FRAGMENTO' : 'FRAGMENT'} {String(fragNum).padStart(2, '0')} / 03 · {loc.name}]</div>
                <p style={{ fontSize: isMobile ? 14 : 16, lineHeight: 2.0, color: '#f0e0c0', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {display}{isTyping && <span style={{ color: '#8B0000', animation: 'blink 0.6s infinite' }}>▌</span>}
                </p>
                {!isTyping && <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #0d0000', fontSize: 10, color: '#00ff41', fontFamily: 'monospace', opacity: 0.7, textShadow: '0 0 8px #00ff41' }}>✓ {T.stored} · GALILEO TESTNET · 0x{Math.random().toString(16).slice(2, 10)}...</div>}
              </div>
            )}

            {done && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#8B0000', letterSpacing: 4, textAlign: 'center', animation: 'blink 1s infinite' }}>{T.done}</div>}
          </div>
        </div>
      </div>

      {/* CHOICES */}
      <div style={{ flexShrink: 0, height: showChoices && !done ? (isMobile ? 120 : 108) : 0, overflow: 'hidden', transition: 'height 0.4s cubic-bezier(0.4,0,0.2,1)', background: '#030000', borderTop: showChoices ? '1px solid #1a0000' : 'none' }}>
        <div style={{ height: isMobile ? 120 : 108, padding: isMobile ? '8px 16px' : '10px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#2a0000', letterSpacing: 4 }}>{T.choose}</div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
            {[{ o: 'A' as const, l: choiceA, b: '#8B0000', h: '#8B0000' }, { o: 'B' as const, l: choiceB, b: '#222', h: '#1a0000' }].map(({ o, l, b, h }) => (
              <button key={o} onClick={() => handleChoice(o)} style={{ flex: 1, height: isMobile ? 44 : 48, background: 'transparent', border: `1px solid ${b}`, color: '#e8d5b0', fontFamily: "'Special Elite', serif", fontSize: 12, cursor: 'none', transition: 'all 0.25s', letterSpacing: 1, padding: '0 12px' }}
                onMouseEnter={e => { e.currentTarget.style.background = h; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e8d5b0' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a0000', fontSize: 11, letterSpacing: 4, fontFamily: "'Special Elite', serif" }}>CARGANDO...</div>}>
      <GameContent />
    </Suspense>
  )
}
