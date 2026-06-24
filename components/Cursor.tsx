'use client'

import { useEffect, useState } from 'react'

export default function Cursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [clicking, setClicking] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    const down = () => setClicking(true)
    const up = () => setClicking(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mousedown', down)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up) }
  }, [])

  const sz = clicking ? 36 : 24

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 99999 }}>
      <div style={{ position: 'absolute', left: pos.x - 50, top: pos.y - 50, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,0,0,0.15) 0%, transparent 70%)', transition: 'left 0.05s, top 0.05s' }} />
      <div style={{ position: 'absolute', left: pos.x - sz / 2, top: pos.y - 0.5, width: sz, height: 1, background: '#cc0000', boxShadow: '0 0 6px #ff0000', transition: 'width 0.1s, left 0.02s, top 0.02s' }} />
      <div style={{ position: 'absolute', left: pos.x - 0.5, top: pos.y - sz / 2, width: 1, height: sz, background: '#cc0000', boxShadow: '0 0 6px #ff0000', transition: 'height 0.1s, left 0.02s, top 0.02s' }} />
      <div style={{ position: 'absolute', left: pos.x - 12, top: pos.y - 12, width: 24, height: 24, borderRadius: '50%', border: '1px solid rgba(200,0,0,0.6)', boxShadow: '0 0 8px #8B0000', transition: 'left 0.02s, top 0.02s' }} />
    </div>
  )
}
