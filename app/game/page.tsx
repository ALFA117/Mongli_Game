'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const NODES = 10
const SPEED = 8

const COLORS = {
  bg: '#000000',
  red: '#8B0000',
  redBright: '#cc0000',
  amber: '#C4923A',
  text: '#e8d5b0',
  muted: '#444',
  green: '#00ff41',
  border: '#1a0000',
}

const TR = {
  es: {
    fragment: 'FRAGMENTO',
    acts: ['ACTO I — LA AMNESIA', 'ACTO II — EL DESDOBLAMIENTO', 'ACTO III — LA REVELACIÓN'],
    access: '▶ ACCEDER AL RECUERDO',
    choose: '— ELIGE TU DESTINO —',
    stored: '✓ GUARDADO EN 0G',
    loading: ['CONECTANDO A 0G...', 'IA PROCESANDO...', 'RECUPERANDO MEMORIA...'],
    choiceA: 'Recordar con culpa',
    choiceB: 'Olvidar y seguir',
    move: 'WASD o flechas para moverte',
    interact: 'E para interactuar',
    complete: '— FIN DE LA HISTORIA —',
    waiting: 'UN RECUERDO ESPERA EN ESTE LUGAR',
  },
  en: {
    fragment: 'FRAGMENT',
    acts: ['ACT I — THE AMNESIA', 'ACT II — THE SPLIT', 'ACT III — THE REVELATION'],
    access: '▶ ACCESS MEMORY',
    choose: '— CHOOSE YOUR FATE —',
    stored: '✓ SAVED ON 0G',
    loading: ['CONNECTING TO 0G...', 'AI PROCESSING...', 'RECOVERING MEMORY...'],
    choiceA: 'Remember with guilt',
    choiceB: 'Forget and move on',
    move: 'WASD or arrows to move',
    interact: 'E to interact',
    complete: '— END OF STORY —',
    waiting: 'A MEMORY AWAITS IN THIS PLACE',
  },
}

const NODE_POSITIONS = [
  { x: 60, y: 40 }, { x: 160, y: 80 }, { x: 80, y: 130 }, { x: 180, y: 170 },
  { x: 70, y: 220 }, { x: 170, y: 260 }, { x: 80, y: 310 }, { x: 180, y: 350 },
  { x: 90, y: 400 }, { x: 180, y: 440 },
]

function GameContent() {
  const searchParams = useSearchParams()
  const initLang = (searchParams.get('lang') || 'es') as 'es' | 'en'

  const [lang, setLang] = useState<'es' | 'en'>(initLang)
  const [playerPos, setPlayerPos] = useState(0)
  const [shadowPos, setShadowPos] = useState(9)
  const [display, setDisplay] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState(0)
  const [choiceA, setChoiceA] = useState('')
  const [choiceB, setChoiceB] = useState('')
  const [showChoices, setShowChoices] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [volume, setVolume] = useState(0.4)
  const [done, setDone] = useState(false)
  const [hasFragment, setHasFragment] = useState(false)
  const [storageHash, setStorageHash] = useState('')

  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const moveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const typeTimerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const loadTimerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const genLockRef = useRef(false)

  const t = TR[lang]
  const act = playerPos < 5 ? 0 : playerPos < 8 ? 1 : 2

  const startAudio = useCallback(() => {
    if (audioCtxRef.current) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0.4
    master.connect(ctx.destination)
    audioCtxRef.current = ctx
    masterGainRef.current = master

    const freqs: [number, OscillatorType, number][] = [[55, 'sine', 0.1], [110, 'sine', 0.05], [82.5, 'triangle', 0.03]]
    freqs.forEach(([freq, type, vol]) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.type = type
      g.gain.value = vol
      o.connect(g)
      g.connect(master)
      o.start()
    })

    const buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    const flt = ctx.createBiquadFilter()
    flt.type = 'lowpass'
    flt.frequency.value = 250
    const ng = ctx.createGain()
    ng.gain.value = 0.015
    src.connect(flt)
    flt.connect(ng)
    ng.connect(master)
    src.start()

    const notes = [130.8, 155.6, 174.6, 196, 174.6, 155.6, 130.8, 123.5]
    let ni = 0
    const playNote = () => {
      if (!audioCtxRef.current) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = notes[ni++ % notes.length]
      o.type = 'triangle'
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.4)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.8)
      o.connect(g)
      g.connect(master)
      o.start()
      o.stop(ctx.currentTime + 2.8)
      setTimeout(playNote, 3000 + Math.random() * 1500)
    }
    setTimeout(playNote, 800)

    const beat = () => {
      if (!audioCtxRef.current) return
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = 58
      o.type = 'sine'
      g.gain.setValueAtTime(0, ctx.currentTime)
      g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05)
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      o.connect(g)
      g.connect(master)
      o.start()
      o.stop(ctx.currentTime + 0.3)
      setTimeout(beat, 1600 + Math.random() * 600)
    }
    setTimeout(beat, 1200)
  }, [])

  useEffect(() => {
    if (masterGainRef.current) masterGainRef.current.gain.value = volume
  }, [volume])

  const typeWriter = useCallback((text: string) => {
    if (typeTimerRef.current) clearInterval(typeTimerRef.current)
    setDisplay('')
    setIsTyping(true)
    setShowChoices(false)
    let i = 0
    typeTimerRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplay(text.slice(0, i + 1))
        i++
      } else {
        if (typeTimerRef.current) clearInterval(typeTimerRef.current)
        setIsTyping(false)
        setShowChoices(true)
      }
    }, SPEED)
  }, [])

  const generateFragment = useCallback(async (choice?: string) => {
    if (genLockRef.current) return
    genLockRef.current = true
    startAudio()
    setIsLoading(true)
    setShowChoices(false)
    setDisplay('')
    setHasFragment(false)
    setStorageHash('')

    let mi = 0
    loadTimerRef.current = setInterval(() => { setLoadMsg(mi++ % 3) }, 900)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: 'noir city night', history: choice ? [...history, choice] : history, fragmentNumber: playerPos + 1, lang }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      const raw: string = data.fragment?.text || data.fragment_text || data.fragment || ''
      const hash: string = data.fragment?.storage_hash || data.storage_hash || ''

      const optA = raw.match(/\[OPCI[ÓO]N A\]:\s*(.+)/i)?.[1]?.trim() || raw.match(/\[OPTION A\]:\s*(.+)/i)?.[1]?.trim() || data.choices?.[0]?.text || t.choiceA
      const optB = raw.match(/\[OPCI[ÓO]N B\]:\s*(.+)/i)?.[1]?.trim() || raw.match(/\[OPTION B\]:\s*(.+)/i)?.[1]?.trim() || data.choices?.[1]?.text || t.choiceB
      const clean = raw.replace(/\[OPCI[ÓO]N [AB]\]:.+/gi, '').replace(/\[OPTION [AB]\]:.+/gi, '').trim()

      setChoiceA(optA)
      setChoiceB(optB)
      setHasFragment(true)
      setStorageHash(hash)
      if (choice) setHistory(prev => [...prev, choice])
      if (playerPos >= NODES - 1) setDone(true)
      typeWriter(clean)
    } catch {
      setDisplay('Error de conexión...')
      setIsTyping(false)
    } finally {
      if (loadTimerRef.current) clearInterval(loadTimerRef.current)
      setIsLoading(false)
      genLockRef.current = false
    }
  }, [history, playerPos, lang, startAudio, t.choiceA, t.choiceB, typeWriter])

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current.add(key)
      if (key === 'e' && !isTyping && !isLoading && !showChoices && !genLockRef.current) generateFragment()
    }
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key.toLowerCase()) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [isTyping, isLoading, showChoices, generateFragment])

  useEffect(() => {
    const tick = () => {
      const keys = keysRef.current
      if (keys.has('arrowup') || keys.has('w')) setPlayerPos(p => Math.max(0, p - 1))
      if (keys.has('arrowdown') || keys.has('s')) setPlayerPos(p => Math.min(NODES - 1, p + 1))
      moveTimerRef.current = setTimeout(tick, 200)
    }
    moveTimerRef.current = setTimeout(tick, 200)
    return () => { if (moveTimerRef.current) clearTimeout(moveTimerRef.current) }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => { setShadowPos(p => Math.max(p - 1, playerPos + 1)) }, 8000)
    return () => clearInterval(interval)
  }, [playerPos])

  const handleChoice = (opt: 'A' | 'B') => {
    const chosen = opt === 'A' ? choiceA : choiceB
    setDisplay('')
    setShowChoices(false)
    setHasFragment(false)
    if (playerPos < NODES - 1) setPlayerPos(p => p + 1)
    generateFragment(chosen)
  }

  return (
    <div onClick={startAudio} style={{ position: 'fixed', inset: 0, background: COLORS.bg, display: 'flex', flexDirection: 'column', fontFamily: '"Special Elite", Georgia, serif', color: COLORS.text, overflow: 'hidden', userSelect: 'none' }}>

      <div style={{ flexShrink: 0, height: 48, background: '#050000', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.muted} strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => setVolume(+e.target.value)} style={{ width: 70, accentColor: COLORS.red }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: COLORS.red, fontSize: 16, letterSpacing: 4, fontWeight: 'bold' }}>MONGLI</span>
          <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'monospace' }}>{t.fragment} {String(playerPos + 1).padStart(2, '0')}/{NODES}</span>
          <span style={{ color: '#2a0000', fontSize: 10 }}>{t.acts[act]}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); setLang(l => l === 'es' ? 'en' : 'es') }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'monospace' }}>{lang.toUpperCase()}</button>
      </div>

      <div style={{ height: 2, background: '#0a0a0a', flexShrink: 0 }}>
        <div style={{ height: '100%', background: `linear-gradient(to right, ${COLORS.red}, ${COLORS.amber})`, width: `${((playerPos + 1) / NODES) * 100}%`, transition: 'width 0.6s ease' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flexShrink: 0, width: 260, background: '#020000', borderRight: `1px solid ${COLORS.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden', paddingTop: 12 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, color: '#2a0000', marginBottom: 4 }}>{t.move}</div>
          <div style={{ fontSize: 8, letterSpacing: 2, color: '#1a0000', marginBottom: 8 }}>{t.interact}</div>
          <svg width="240" height="480" style={{ overflow: 'visible' }}>
            {NODE_POSITIONS.map((n, i) => {
              if (i === 0) return null
              const prev = NODE_POSITIONS[i - 1]
              return <line key={`l${i}`} x1={prev.x} y1={prev.y} x2={n.x} y2={n.y} stroke={i <= playerPos ? COLORS.red : '#111'} strokeWidth={i <= playerPos ? 1.5 : 1} strokeDasharray={i <= playerPos ? '' : '4 4'} />
            })}
            {NODE_POSITIONS.map((n, i) => {
              const isActive = i === playerPos
              const isDone = i < playerPos
              const isShadow = i === shadowPos
              const r = 14
              const pts = Array.from({ length: 6 }, (_, k) => { const a = (Math.PI / 180) * (60 * k - 30); return `${n.x + r * Math.cos(a)},${n.y + r * Math.sin(a)}` }).join(' ')
              return (
                <g key={i}>
                  {isActive && <circle cx={n.x} cy={n.y} r={22} fill="none" stroke={COLORS.red} strokeWidth={1} opacity={0.3}><animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" /></circle>}
                  <polygon points={pts} fill={isActive ? COLORS.red : isDone ? '#1a0800' : '#0a0a0a'} stroke={isActive ? '#ff2200' : isDone ? COLORS.red : '#222'} strokeWidth={isActive ? 2 : 1} />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fill={isDone ? COLORS.amber : isActive ? '#fff' : '#333'} fontSize="9" fontFamily="monospace">{isDone ? '✓' : isActive ? '◆' : i + 1}</text>
                  {isActive && <g><rect x={n.x-8} y={n.y-36} width={16} height={20} rx={2} fill="#1a1a1a" stroke={COLORS.red} strokeWidth={0.5}/><rect x={n.x-6} y={n.y-32} width={12} height={4} rx={1} fill="#c4923a"/><rect x={n.x-4} y={n.y-27} width={8} height={8} fill="#333"/><circle cx={n.x-1} cy={n.y-23} r={1} fill="#fff"/><circle cx={n.x+3} cy={n.y-23} r={1} fill="#fff"/></g>}
                  {i === 3 && !isDone && <g><rect x={n.x-6} y={n.y-34} width={12} height={16} rx={2} fill={COLORS.amber} opacity={0.6}/><text x={n.x} y={n.y-38} textAnchor="middle" fontSize="10" fill={COLORS.amber} fontFamily="monospace" fontWeight="bold">!</text></g>}
                  {isShadow && <g><circle cx={n.x} cy={n.y-20} r={14} fill="rgba(139,0,0,0.08)"><animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite"/></circle><rect x={n.x-7} y={n.y-34} width={14} height={18} rx={2} fill="#080808"/><circle cx={n.x-2} cy={n.y-26} r={1.5} fill="#ff0000"><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/></circle><circle cx={n.x+4} cy={n.y-26} r={1.5} fill="#ff0000"><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.3s"/></circle></g>}
                </g>
              )
            })}
          </svg>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {!hasFragment && !isLoading && !display && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ fontSize: 11, color: '#2a0000', letterSpacing: 4, textAlign: 'center' }}>{t.waiting}</div>
                <button onClick={e => { e.stopPropagation(); generateFragment() }} style={{ background: 'transparent', border: `1px solid ${COLORS.red}`, color: COLORS.red, padding: '14px 36px', fontFamily: '"Special Elite", serif', fontSize: 13, cursor: 'pointer', letterSpacing: 3, transition: 'all 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = COLORS.red; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.red }}>
                  {t.access}
                </button>
                <div style={{ fontSize: 10, color: '#1a0000', letterSpacing: 2 }}>{t.move} · {t.interact}</div>
              </div>
            )}
            {isLoading && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                {t.loading.map((msg, i) => <div key={i} style={{ fontSize: 11, letterSpacing: 2, color: i === loadMsg ? COLORS.red : '#1a0000', transition: 'color 0.5s', fontFamily: 'monospace' }}>{i <= loadMsg ? '▶' : '·'} {msg}</div>)}
              </div>
            )}
            {display && (
              <div style={{ background: '#04000a', border: `1px solid ${COLORS.border}`, borderLeft: `3px solid ${COLORS.red}`, padding: '20px 24px', borderRadius: 2 }}>
                <div style={{ fontSize: 9, color: '#2a0000', letterSpacing: 4, marginBottom: 14, fontFamily: 'monospace' }}>[{t.fragment} {String(playerPos + 1).padStart(2, '0')} / {NODES}]</div>
                <p style={{ fontSize: 15, lineHeight: 1.95, color: COLORS.text, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {display}{isTyping && <span style={{ color: COLORS.red, animation: 'blink 0.6s infinite' }}>▌</span>}
                </p>
                {!isTyping && storageHash && <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, fontSize: 10, color: COLORS.green, fontFamily: 'monospace', opacity: 0.7 }}>{t.stored} · {storageHash.slice(0, 22)}...</div>}
              </div>
            )}
            {done && !isTyping && <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: COLORS.red, letterSpacing: 4 }}>{t.complete}</div>}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, height: showChoices && !done ? 108 : 0, overflow: 'hidden', transition: 'height 0.5s cubic-bezier(0.4,0,0.2,1)', background: '#030000', borderTop: showChoices ? `1px solid ${COLORS.border}` : 'none' }}>
        <div style={{ height: 108, padding: '10px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#2a0000', letterSpacing: 4 }}>{t.choose}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {([{ opt: 'A' as const, label: choiceA, bc: COLORS.red, hbg: COLORS.red }, { opt: 'B' as const, label: choiceB, bc: '#222', hbg: '#1a0000' }]).map(({ opt, label, bc, hbg }) => (
              <button key={opt} onClick={e => { e.stopPropagation(); handleChoice(opt) }}
                style={{ flex: 1, height: 44, background: 'transparent', border: `1px solid ${bc}`, color: COLORS.text, fontFamily: '"Special Elite", serif', fontSize: 12, cursor: 'pointer', transition: 'all 0.25s', letterSpacing: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = hbg; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = COLORS.redBright }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = COLORS.text; e.currentTarget.style.borderColor = bc }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:#000}::-webkit-scrollbar-thumb{background:#2a0000}`}</style>
    </div>
  )
}

export default function GamePage() {
  return <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#000' }} />}><GameContent /></Suspense>
}
