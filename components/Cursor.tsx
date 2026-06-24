'use client'

import { useEffect, useRef, useState } from 'react'

interface Drop { id: number; x: number; y: number }

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -100, y: -100 })
  const [drops, setDrops] = useState<Drop[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    let stillTimer: ReturnType<typeof setTimeout> | null = null

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY }
      if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      if (stillTimer) clearTimeout(stillTimer)
      stillTimer = setTimeout(() => {
        const did = ++idRef.current
        setDrops(p => [...p.slice(-3), { id: did, x: pos.current.x, y: pos.current.y }])
        setTimeout(() => setDrops(p => p.filter(d => d.id !== did)), 1200)
      }, 2500)
    }
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mousemove', onMove); if (stillTimer) clearTimeout(stillTimer) }
  }, [])

  return (
    <>
      <div ref={ref} style={{ position: 'fixed', top: 0, left: 0, zIndex: 99999, pointerEvents: 'none', transform: 'translate(-100px,-100px)' }}>
        <div style={{ position: 'absolute', top: -12, left: -0.5, width: 1, height: 24, background: '#8B0000', boxShadow: '0 0 4px rgba(139,0,0,0.6)' }}/>
        <div style={{ position: 'absolute', top: -0.5, left: -12, width: 24, height: 1, background: '#8B0000', boxShadow: '0 0 4px rgba(139,0,0,0.6)' }}/>
        <div style={{ position: 'absolute', top: -11, left: -11, width: 22, height: 22, borderRadius: '50%', border: '1px solid #8B0000', animation: 'cursor-pulse 1s ease-in-out infinite' }}/>
        <div style={{ position: 'absolute', top: -2, left: -2, width: 4, height: 4, borderRadius: '50%', background: '#8B0000', boxShadow: '0 0 8px rgba(139,0,0,0.8)' }}/>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.06) 0%, transparent 70%)' }}/>
      </div>
      {drops.map(d => (
        <div key={d.id} style={{ position: 'fixed', left: d.x - 2, top: d.y + 12, width: 4, height: 4, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: '#8B0000', zIndex: 99998, pointerEvents: 'none', animation: 'blood-drop 1.2s ease-in forwards', boxShadow: '0 0 3px rgba(139,0,0,0.4)' }}/>
      ))}
    </>
  )
}
