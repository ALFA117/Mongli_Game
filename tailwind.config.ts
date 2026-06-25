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
        noir: {
          bg: "#0a0a0a",
          text: "#f0e4c8",
          accent: "#d4a244",
          border: "#333333",
          card: "#141414",
          muted: "#9a8a6a",
        },
      },
      fontFamily: {
        display: ['"Special Elite"', "cursive"],
        body: ['"IBM Plex Mono"', "monospace"],
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
