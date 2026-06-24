'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import dynamic from 'next/dynamic'
import WalletButton from '@/components/WalletButton'
import { audioEngine } from '@/lib/audioEngine'

const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })
const Skull3D = dynamic(() => import('@/components/Skull3D'), {
  ssr: false,
  loading: () => <div style={{ width: 420, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a0000', fontSize: 12, letterSpacing: 3 }}>CARGANDO...</div>,
})

const TR = {
  es: {
    title: 'MONGLI', sub: 'Alguien tomó tus recuerdos. Recupéralos antes de que sea tarde.',
    wake: 'TOCA PARA DESPERTAR', where: '¿ Dónde despertar ?', ver: 'MONGLI v0.8 // Claude AI + 0G Chain',
    scenes: [
      { id: 'alley', t: 'El callejón', d: 'Despiertas en un callejón oscuro. La lluvia golpea el asfalto.' },
      { id: 'office', t: 'La oficina', d: 'Un escritorio viejo. Una lámpara parpadea. Hay una foto boca abajo.' },
      { id: 'train', t: 'El tren', d: 'El vagón está vacío. Afuera es de noche. No recuerdas el boleto.' },
    ],
  },
  en: {
    title: 'MONGLI', sub: 'Someone took your memories. Take them back before it\'s too late.',
    wake: 'TAP TO AWAKEN', where: 'Where to awaken?', ver: 'MONGLI v0.8 // Claude AI + 0G Chain',
    scenes: [
      { id: 'alley', t: 'The alley', d: 'You wake in a dark alley. Rain hits the pavement.' },
      { id: 'office', t: 'The office', d: 'An old desk. A lamp flickers. A photo face-down.' },
      { id: 'train', t: 'The train', d: 'Empty car. Night outside. You don\'t remember the ticket.' },
    ],
  },
}

const FOG = Array.from({ length: 8 }, (_, i) => ({ left: `${10 + (i * 12) % 80}%`, top: `${15 + (i * 17) % 65}%`, w: 200 + (i * 37) % 200, dur: 8 + i * 1.3, delay: i * 0.8 }))
const RAIN = Array.from({ length: 30 }, (_, i) => ({ left: `${(i * 3.4) % 100}%`, h: 15 + (i * 7) % 25, dur: 0.6 + i * 0.03, delay: (i * 0.15) % 2 }))
const DUST = Array.from({ length: 20 }, (_, i) => ({ left: `${(i * 5.1) % 100}%`, top: `${(i * 7.3) % 100}%`, size: 2 + (i % 3), dur: 6 + i * 0.8, delay: i * 0.4, color: i % 5 === 0 ? 'rgba(139,0,0,0.3)' : 'rgba(196,146,58,0.15)' }))

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => { const c = () => setMobile(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c) }, [])
  return mobile
}

export default function Home() {
  const { isConnected } = useAccount()
  const router = useRouter()
  const mobile = useIsMobile()
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [audioOn, setAudioOn] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [awake, setAwake] = useState(false)
  const [subText, setSubText] = useState('')
  const [subDone, setSubDone] = useState(false)
  const t = TR[lang]

  useEffect(() => { const s = localStorage.getItem('mongli-lang') as 'es' | 'en' | null; if (s === 'en' || s === 'es') setLang(s) }, [])

  const wake = useCallback(() => { audioEngine.start(); setAudioOn(true); setAwake(true) }, [])

  useEffect(() => {
    if (!awake) return
    const full = t.sub; let i = 0; setSubText(''); setSubDone(false)
    const iv = setInterval(() => { if (i < full.length) { setSubText(full.slice(0, i + 1)); i++ } else { clearInterval(iv); setSubDone(true) } }, 35)
    return () => clearInterval(iv)
  }, [awake, t.sub])

  const toggleLang = () => { const nl = lang === 'es' ? 'en' : 'es'; setLang(nl); localStorage.setItem('mongli-lang', nl) }

  if (!awake) {
    return (
      <div onClick={wake} style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Cursor />
        <p style={{ fontFamily: "var(--font-display, 'Special Elite'), serif", fontSize: 'clamp(18px, 4vw, 28px)', color: '#8B0000', animation: 'pulse-text 2s ease-in-out infinite', letterSpacing: 4 }}>{t.wake}</p>
      </div>
    )
  }

  const skullSize = mobile ? 280 : 420

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
      <Cursor />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, #1a0000 0%, #000 55%)', zIndex: 0 }} />

      {FOG.map((f, i) => <div key={`f${i}`} style={{ position: 'absolute', left: f.left, top: f.top, width: f.w, height: f.w * 0.6, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(139,0,0,0.08), transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none', zIndex: 1, animation: `fog-drift ${f.dur}s ease-in-out ${f.delay}s infinite alternate` }} />)}

      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 2 }}>
        {RAIN.map((r, i) => <div key={`r${i}`} style={{ position: 'absolute', left: r.left, top: -30, width: 1, height: r.h, background: 'linear-gradient(to bottom, transparent, rgba(150,160,180,0.25))', animation: `rain-fall ${r.dur}s linear ${r.delay}s infinite`, transform: 'rotate(8deg)' }} />)}
      </div>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, overflow: 'hidden' }}>
        <div style={{ width: '100%', height: 2, background: 'rgba(139,0,0,0.06)', animation: 'scanline-move 4s linear infinite' }} />
      </div>

      <div className="static-noise" style={{ position: 'absolute', inset: 0, zIndex: 3 }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', boxShadow: 'inset 0 0 200px #000, inset 0 0 100px rgba(0,0,0,0.8)' }} />

      {DUST.map((d, i) => <div key={`d${i}`} style={{ position: 'absolute', left: d.left, top: d.top, width: d.size, height: d.size, borderRadius: '50%', background: d.color, pointerEvents: 'none', zIndex: 5, animation: `dust-float ${d.dur}s ease-in-out ${d.delay}s infinite alternate` }} />)}

      {/* HUD */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { const on = audioEngine.toggle(); setAudioOn(on) }} style={{ background: 'none', border: 'none', padding: 4, color: '#8B0000', fontSize: 14 }}>{audioOn ? '🔊' : '🔇'}</button>
          {audioOn && <input type="range" min="0" max="1" step="0.01" value={volume} onChange={e => { const v = +e.target.value; setVolume(v); audioEngine.setVolume(v) }} className="volume-slider" />}
        </div>
        <button onClick={toggleLang} style={{ background: 'transparent', border: '1px solid #1a0000', color: '#555', fontSize: 10, padding: '3px 8px', fontFamily: 'monospace' }}>{lang.toUpperCase()}</button>
      </div>

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: mobile ? '0 12px' : '0 16px', gap: 4 }}>

        <div style={{ filter: 'drop-shadow(0 0 40px rgba(139,0,0,0.7)) drop-shadow(0 0 80px rgba(139,0,0,0.4))', willChange: 'transform' }}>
          <Skull3D size={skullSize} />
        </div>

        <h1 className="glitch-title" data-text={t.title} style={{ fontFamily: "var(--font-horror, 'Creepster'), var(--font-display, 'Special Elite'), cursive", marginBottom: 4, lineHeight: 1, fontSize: mobile ? 'clamp(50px, 12vw, 100px)' : undefined }}>
          {t.title}
        </h1>

        <div style={{ width: mobile ? '90%' : 380, marginBottom: 12 }}>
          <div style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(139,0,0,0.3), transparent)', marginBottom: 10 }} />
          <p style={{ fontFamily: 'monospace', fontSize: mobile ? 11 : 12, color: 'rgba(232,213,176,0.4)', textAlign: 'center', lineHeight: 1.6 }}>
            {subText}{!subDone && <span style={{ color: '#8B0000', animation: 'blink 0.6s infinite' }}>▌</span>}
          </p>
        </div>

        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(0,255,65,0.25)', marginBottom: 10 }}>
          <span style={{ color: 'rgba(0,255,65,0.4)' }}>●</span> 0G Galileo Testnet
        </p>

        <WalletButton />

        {isConnected && (
          <div style={{ width: '100%', maxWidth: 640, marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(139,0,0,0.1)' }} />
              <span style={{ fontSize: 10, color: 'rgba(139,0,0,0.25)', fontFamily: 'monospace', letterSpacing: 3 }}>{t.where}</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(139,0,0,0.1)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)', gap: 10 }}>
              {t.scenes.map(sc => (
                <button key={sc.id} onClick={() => router.push(`/map?lang=${lang}`)} className="scene-card glass-panel" style={{ padding: mobile ? 12 : 14, textAlign: 'left', cursor: 'pointer' }}>
                  <div style={{ fontFamily: "var(--font-display), serif", fontSize: 14, color: 'rgba(232,213,176,0.5)', marginBottom: 4 }}>{sc.t}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(232,213,176,0.15)', lineHeight: 1.5 }}>{sc.d}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <p style={{ position: 'absolute', bottom: 8, left: 12, fontSize: 9, color: 'rgba(139,0,0,0.12)', fontFamily: 'monospace', zIndex: 10 }}>{t.ver}</p>

      <style>{`
        @keyframes fog-drift{0%{transform:translate(0,0) scale(1)}100%{transform:translate(30px,-20px) scale(1.15)}}
        @keyframes rain-fall{from{transform:translateY(-30px) rotate(8deg)}to{transform:translateY(100vh) rotate(8deg)}}
        @keyframes scanline-move{from{transform:translateY(-2px)}to{transform:translateY(100vh)}}
        @keyframes dust-float{0%{transform:translate(0,0);opacity:.3}50%{opacity:.6}100%{transform:translate(15px,-20px);opacity:.2}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse-text{0%,100%{opacity:.4}50%{opacity:1}}
      `}</style>
    </div>
  )
}
