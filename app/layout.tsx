import type { Metadata } from "next";
import { Special_Elite, IBM_Plex_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Mongli Game — Tus recuerdos, on-chain",
  description:
    "Juego narrativo de amnesia psicológica. La IA escribe tu historia, la blockchain la guarda para siempre.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${specialElite.variable} ${ibmPlexMono.variable}`}>
      <body className="font-mono bg-[#0a0a0a] text-[#e8d5b0] min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
