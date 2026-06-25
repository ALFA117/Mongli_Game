import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mongli Game — Amnesia Noir",
  description:
    "Juego narrativo de amnesia psicológica donde la IA escribe tu historia y la blockchain la guarda para siempre.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mongli Game",
  },
  other: {
    "theme-color": "#0a0a0a",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Special+Elite&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap"
        />
      </head>
      <body className="grain vignette antialiased min-h-screen">{children}</body>
    </html>
  );
}
