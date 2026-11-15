import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Expediente" palette: cool off-black, paper white, one signal red.
        noir: {
          bg: "#0B0B0C",
          text: "#ECE8E1",
          accent: "#E5483D", // text/borders on dark (4.8:1 on bg)
          fill: "#B3261E", // filled buttons with light text (6.6:1)
          border: "#2A292D",
          card: "#131315",
          raised: "#1A1A1D",
          muted: "#A29C92", // secondary text (7:1 on bg)
          faint: "#77726A",
          ok: "#7FB685",
        },
        mongli: {
          red: "#B3261E",
          glow: "#E5483D",
          bone: "#ECE8E1",
          shadow: "#A29C92",
          surface: "#131315",
        },
      },
      fontFamily: {
        display: ['"Archivo"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        body: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
        stamp: ['"Special Elite"', '"IBM Plex Mono"', "monospace"],
      },
      boxShadow: {
        hard: "4px 4px 0 0 rgba(0,0,0,0.6)",
        "hard-accent": "4px 4px 0 0 #5A1712",
      },
      animation: {
        "fade-in": "fadeIn 1.5s ease-out forwards",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        flicker: "flicker 4s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(196,146,58,0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(196,146,58,0.6)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.95" },
          "52%": { opacity: "0.85" },
          "54%": { opacity: "1" },
          "80%": { opacity: "0.9" },
          "82%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
