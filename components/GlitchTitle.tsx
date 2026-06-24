"use client";

export default function GlitchTitle() {
  return (
    <div className="glitch-wrapper relative select-none">
      <h1
        className="glitch font-[family-name:var(--font-display)] text-6xl sm:text-8xl md:text-9xl tracking-[0.2em] text-[#e8d5b0]"
        data-text="MONGLI"
      >
        MONGLI
      </h1>

      <style jsx>{`
        .glitch {
          position: relative;
          animation: shift 4s ease-in-out infinite alternate;
        }

        .glitch::before,
        .glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch::before {
          color: #ff0040;
          animation: glitch-1 3s infinite linear alternate-reverse;
          clip-path: inset(0 0 50% 0);
        }

        .glitch::after {
          color: #00e5ff;
          animation: glitch-2 2.5s infinite linear alternate-reverse;
          clip-path: inset(50% 0 0 0);
        }

        @keyframes glitch-1 {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -1px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(4px, 1px); }
          100% { transform: translate(0); }
        }

        @keyframes glitch-2 {
          0% { transform: translate(0); }
          20% { transform: translate(4px, -1px); }
          40% { transform: translate(-3px, 2px); }
          60% { transform: translate(2px, 1px); }
          80% { transform: translate(-4px, -2px); }
          100% { transform: translate(0); }
        }

        @keyframes shift {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(-5px, 2px) skewX(-1deg); }
          94% { transform: translate(3px, -1px) skewX(0.5deg); }
          96% { transform: translate(-2px, 3px); }
          98% { transform: translate(4px, -2px) skewX(-0.5deg); }
        }
      `}</style>
    </div>
  );
}
