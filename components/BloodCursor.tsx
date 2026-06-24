'use client'

import { useEffect, useRef, useState } from 'react'

export default function BloodCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const posRef = useRef({ x: -100, y: -100 })
  const [drops, setDrops] = useState<{ id: number; x: number; y: number }[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    let stillTimer: ReturnType<typeof setTimeout> | null = null

    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }

      if (stillTimer) clearTimeout(stillTimer)
      stillTimer = setTimeout(() => {
        const dropId = ++idRef.current
        setDrops((prev) => [...prev.slice(-4), { id: dropId, x: posRef.current.x, y: posRef.current.y }])
        setTimeout(() => {
          setDrops((prev) => prev.filter((d) => d.id !== dropId))
        }, 1200)
      }, 3000)
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (stillTimer) clearTimeout(stillTimer)
    }
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          transform: 'translate(-100px, -100px)',
        }}
      >
        {/* Crosshair lines */}
        <div style={{
          position: 'absolute',
          top: -10,
          left: -0.5,
          width: 1,
          height: 20,
          background: '#8B0000',
        }} />
        <div style={{
          position: 'absolute',
          top: -0.5,
          left: -10,
          width: 20,
          height: 1,
          background: '#8B0000',
        }} />
        {/* Pulsing outer ring */}
        <div style={{
          position: 'absolute',
          top: -10,
          left: -10,
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1px solid #8B0000',
          animation: 'cursor-pulse 1s ease-in-out infinite',
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          top: -2,
          left: -2,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#8B0000',
          boxShadow: '0 0 6px rgba(139,0,0,0.6)',
        }} />
        {/* Red glow */}
        <div style={{
          position: 'absolute',
          top: -50,
          left: -50,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,0,0,0.08) 0%, transparent 70%)',
        }} />
      </div>

      {/* Blood drops */}
      {drops.map((d) => (
        <div
          key={d.id}
          style={{
            position: 'fixed',
            left: d.x - 2,
            top: d.y + 10,
            width: 4,
            height: 4,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: '#8B0000',
            zIndex: 99998,
            pointerEvents: 'none',
            animation: 'blood-drop 1.2s ease-in forwards',
            boxShadow: '0 0 3px rgba(139,0,0,0.4)',
          }}
        />
      ))}
    </>
  )
}
