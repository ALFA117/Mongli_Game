'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const Skull3D = dynamic(() => import('@/components/Skull3D'), {
  ssr: false,
  loading: () => <div style={{ width: 380, height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2a0000', fontSize: 11, letterSpacing: 4 }}>CARGANDO...</div>,
})
const Cursor = dynamic(() => import('@/components/Cursor'), { ssr: false })

export default function Home() {
  const router = useRouter()
  const [lang, setLang] = useState<'es' | 'en'>('es')
  const [subtitle, setSubtitle] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  const T = {
    es: { sub: 'Alguien tomó tus recuerdos. Recupéralos antes de que sea tarde.', btn: 'RECUPERA TU IDENTIDAD', hint: 'Haz clic para comenzar' },
    en: { sub: 'Someone took your memories. Take them back before it\'s too late.', btn: 'RECLAIM YOUR IDENTITY', hint: 'Click to begin' },
  }

  useEffect(() => { setIsMobile(window.innerWidth < 768) }, [])

  useEffect(() => {
    const text = T[lang].sub; setSubtitle(''); let i = 0
    const iv = setInterval(() => { if (i < text.length) setSubtitle(text.slice(0, ++i)); else clearInterval(iv) }, 35)
    return () => clearInterval(iv)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const [rainDrops] = useState(() => Array.from({ length: 25 }, (_, i) => ({ id: i, left: Math.random() * 100, height: 40 + Math.random() * 60, duration: 1 + Math.random() * 2, delay: Math.random() * 4 })))

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: 0 }}>
      <Cursor />

      {rainDrops.map(d => <div key={d.id} style={{ position: 'absolute', left: `${d.left}%`, top: 0, width: 1, height: d.height, background: 'rgba(139,0,0,0.25)', animation: `rain ${d.duration}s linear infinite`, animationDelay: `${d.delay}s`, pointerEvents: 'none' }} />)}

      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.85) 100%)', pointerEvents: 'none', zIndex: 1 }} />

      {[0, 1, 2, 3].map(i => <div key={`fog${i}`} style={{ position: 'absolute', width: 300 + i * 100, height: 300 + i * 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.07) 0%, transparent 70%)', left: `${15 + i * 20}%`, top: `${10 + i * 20}%`, transform: 'translate(-50%,-50%)', animation: `fog ${5 + i * 2}s ease-in-out infinite`, animationDelay: `${i * 1.2}s`, pointerEvents: 'none', zIndex: 0 }} />)}

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <button onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
          style={{ background: 'transparent', border: '1px solid #2a0000', color: '#555', padding: '6px 14px', fontFamily: 'monospace', fontSize: 12, cursor: 'none', letterSpacing: 2, transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B0000'; e.currentTarget.style.color = '#8B0000' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a0000'; e.currentTarget.style.color = '#555' }}>
          {lang === 'es' ? 'EN' : 'ES'}
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div style={{ marginBottom: -20 }}><Skull3D size={isMobile ? 260 : 380} /></div>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <h1 style={{ fontSize: isMobile ? 64 : 96, fontFamily: "'VT323', monospace", color: '#fff', letterSpacing: 12, margin: 0, lineHeight: 1, textShadow: '0 0 20px rgba(139,0,0,0.8)' }}>MONGLI</h1>
          <h1 aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, fontSize: isMobile ? 64 : 96, fontFamily: "'VT323', monospace", color: '#ff0000', letterSpacing: 12, margin: 0, lineHeight: 1, animation: 'glitch-1 4s infinite', animationDelay: '0.5s', opacity: 0.7 }}>MONGLI</h1>
          <h1 aria-hidden="true" style={{ position: 'absolute', top: 0, left: 0, fontSize: isMobile ? 64 : 96, fontFamily: "'VT323', monospace", color: '#00ffff', letterSpacing: 12, margin: 0, lineHeight: 1, animation: 'glitch-2 4s infinite', animationDelay: '1s', opacity: 0.5 }}>MONGLI</h1>
        </div>

        <div style={{ width: isMobile ? 200 : 320, height: 1, background: 'linear-gradient(to right, transparent, #8B0000, transparent)', marginBottom: 16 }} />

        <p style={{ fontSize: isMobile ? 13 : 15, color: '#888', textAlign: 'center', maxWidth: isMobile ? 280 : 420, lineHeight: 1.6, marginBottom: 32, minHeight: 48, letterSpacing: 1 }}>
          {subtitle}<span style={{ animation: 'blink 0.8s infinite', color: '#8B0000' }}>▌</span>
        </p>

        <button onClick={() => router.push('/map')}
          style={{ background: 'transparent', border: '1px solid #8B0000', color: '#e8d5b0', padding: isMobile ? '14px 32px' : '16px 48px', fontFamily: "'Special Elite', serif", fontSize: isMobile ? 13 : 15, letterSpacing: 4, cursor: 'none', animation: 'pulse-red 2s infinite', transition: 'all 0.3s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#8B0000'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.03)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e8d5b0'; e.currentTarget.style.transform = 'scale(1)' }}>
          {T[lang].btn}
        </button>

        <p style={{ marginTop: 16, fontSize: 10, color: '#333', letterSpacing: 3, animation: 'blink 2s infinite' }}>{T[lang].hint}</p>
      </div>
    </div>
  )
}
