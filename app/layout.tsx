import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MONGLI — Recupera tu identidad',
  description: 'Juego narrativo noir donde la IA genera tu historia y 0G la guarda para siempre',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  )
}
