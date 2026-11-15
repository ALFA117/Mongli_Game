import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AudioInit } from "@/components/AudioInit";

const SITE_URL = "https://mongli-game.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mongli Game — Tu memoria vive en la blockchain",
  description:
    "5 game modes · AI narrative · 0G blockchain · 22 routes · Zero Cup 2026. Juego noir donde la IA escribe tu historia y tu avance queda registrado on-chain en 0G Galileo testnet.",
  keywords: "0G, blockchain, AI game, noir, amnesia, Zero Cup 2026, Claude, Gemini, Web3, hackathon",
  authors: [{ name: "Edgar Lopez Baeza", url: "https://github.com/ALFA117" }],
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/favicon.svg", type: "image/svg+xml" },
  ],
  openGraph: {
    title: "Mongli Game — Tu memoria vive en la blockchain",
    description: "Juego noir de amnesia donde la IA escribe tu historia y tu avance queda registrado on-chain en 0G Galileo testnet.",
    url: SITE_URL,
    siteName: "Mongli Game",
    images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: "Mongli Game — Amnesia Noir" }],
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mongli Game — Tu memoria vive en la blockchain",
    description: "Juego noir de amnesia. La IA escribe. La blockchain recuerda.",
    images: [`${SITE_URL}/api/og`],
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mongli Game",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0B0C",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=Special+Elite&family=Caveat:wght@400;600&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..800&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&family=Special+Elite&family=Caveat:wght@400;600&display=swap"
        />
      </head>
      <body className="grain vignette antialiased min-h-screen">
        <AudioInit />
        {children}
      </body>
    </html>
  );
}
