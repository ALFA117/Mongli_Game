'use client'

import { useEffect, useRef } from 'react'

type SpriteType = 'detective' | 'shadow' | 'witness'

const COLORS: Record<string, string> = {
  '0': '',
  '1': '#1a1a1a',
  '2': '#4a4a4a',
  '3': '#2a2a2a',
  '4': '#c4923a',
  '5': '#ffffff',
  '6': '#8B0000',
  '7': '#e8d5b0',
  '8': '#d4b896',
  '9': '#ff0000',
}

const DETECTIVE = [
  '0000333333330000',
  '0003333333333300',
  '0033333333333330',
  '0003388888833300',
  '0038888888883800',
  '0038855588883800',
  '0038884488883800',
  '0000388888330000',
  '0033222222223300',
  '0322222222222230',
  '0322222222222230',
  '0033222222223300',
  '0003311111133000',
  '0003311111133000',
  '0003310000133000',
  '0003310000133000',
]

const SHADOW = [
  '0000011111000000',
  '0001111111110000',
  '0011111111111000',
  '0111111111111100',
  '0111199119911100',
  '0111199119911100',
  '0111111111111100',
  '0111111111111100',
  '0011111111111000',
  '0001111111110000',
  '0011111111111000',
  '0111111111111100',
  '0111111111111100',
  '0011111111111000',
  '0001110001110000',
  '0001110001110000',
]

const WITNESS = [
  '0000044444000000',
  '0004444444440000',
  '0044444444444000',
  '0044411114444000',
  '0044477744444000',
  '0044477744444000',
  '0044411114444000',
  '0004444444440000',
  '0004444444440000',
  '0044444444444000',
  '0044444444444000',
  '0044444444444000',
  '0044444444444000',
  '0004440004440000',
  '0004440004440000',
  '0004440004440000',
]

const SPRITES: Record<SpriteType, string[]> = {
  detective: DETECTIVE,
  shadow: SHADOW,
  witness: WITNESS,
}

interface Props {
  type: SpriteType
  size?: number
  className?: string
}

export default function PixelSprite({ type, size = 96, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, 16, 16)
    const sprite = SPRITES[type]

    for (let y = 0; y < 16; y++) {
      const row = sprite[y]
      if (!row) continue
      for (let x = 0; x < 16; x++) {
        const c = row[x]
        if (c === '0') continue
        const color = COLORS[c]
        if (!color) continue
        ctx.fillStyle = color
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }, [type])

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      {type === 'shadow' && (
        <div style={{
          position: 'absolute',
          inset: -10,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,0,0,0.15), transparent 70%)',
          animation: 'shadow-pulse 1.5s ease-in-out infinite',
        }} />
      )}
      {type === 'witness' && (
        <div style={{
          position: 'absolute',
          top: -16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#C4923A',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          fontSize: 14,
          textShadow: '0 0 6px rgba(196,146,58,0.6)',
        }}>!</div>
      )}
      <canvas
        ref={canvasRef}
        width={16}
        height={16}
        style={{
          width: size,
          height: size,
          imageRendering: 'pixelated',
          position: 'relative',
          zIndex: 1,
        }}
      />
    </div>
  )
}
