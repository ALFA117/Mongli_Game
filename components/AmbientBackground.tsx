"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";

/**
 * Fondo ambiental (receta 3 de /diseno: globo de puntos con arcos), adaptado
 * a Mongli Game como una "esfera de memoria": cientos de fragmentos de
 * identidad en color hueso que giran despacio; cada tanto un arco rojo une dos
 * recuerdos (uno que se recupera) y deja una chispa, y algunos fragmentos
 * parpadean como señal corrupta. Capas: niebla roja lejana (CSS), esfera
 * (canvas) y viñeta noir. Completo en la portada; tranquilo en el resto, y
 * casi invisible dentro del juego para no competir con la narración.
 */

type Arc = { from: number; to: number; born: number };

function makeSphere(n: number) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: n }, (_, i) => {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    return [Math.cos(th) * r, y, Math.sin(th) * r] as const;
  });
}

function MemorySphere({ reduce, mobile, strength, px, py }: {
  reduce: boolean; mobile: boolean; strength: number; px: MotionValue<number>; py: MotionValue<number>;
}) {
  const [el, setEl] = useState<HTMLCanvasElement | null>(null);
  const pts = useRef(makeSphere(mobile ? 320 : 680));
  const arcs = useRef<Arc[]>([]);
  const last = useRef(0);

  useEffect(() => { pts.current = makeSphere(mobile ? 320 : 680); }, [mobile]);

  const draw = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    ctx.clearRect(0, 0, w, h);
    const R = Math.min(w, h) * (mobile ? 0.4 : 0.3);
    const cx = mobile ? w * 0.5 : w * 0.5;
    const cy = mobile ? h * 0.2 : h * 0.27;
    const spin = t * 0.06 + px.get() * 0.3;
    const tilt = 0.3 + py.get() * 0.12;
    const st = Math.sin(tilt), ct = Math.cos(tilt);
    const proj: Array<[number, number, number]> = [];
    pts.current.forEach(([x0, y0, z0], i) => {
      const x1 = x0 * Math.cos(spin) - z0 * Math.sin(spin);
      const z1 = x0 * Math.sin(spin) + z0 * Math.cos(spin);
      const y2 = y0 * ct - z1 * st;
      const z2 = y0 * st + z1 * ct;
      const k = 3.2 / (3.2 - z2);
      const sx = cx + x1 * R * k, sy = cy + y2 * R * k;
      proj.push([sx, sy, z2]);
      const front = z2 > 0 ? z2 : 0;
      // Señal corrupta: algunos fragmentos se apagan a ratos.
      const glitch = !reduce && (i * 7919 + Math.floor(t * 3)) % 97 === 0 ? 0.15 : 1;
      ctx.fillStyle = `rgba(229,222,201,${(0.1 + 0.5 * front) * strength * glitch})`;
      ctx.beginPath();
      ctx.arc(sx, sy, (0.7 + front * 1.1) * k, 0, Math.PI * 2);
      ctx.fill();
    });
    if (reduce) return;

    if (t - last.current > 1.6 && arcs.current.length < (mobile ? 2 : 3)) {
      last.current = t;
      const n = pts.current.length;
      arcs.current.push({ from: Math.floor(Math.random() * n), to: Math.floor(Math.random() * n), born: t });
    }
    arcs.current = arcs.current.filter((a) => t - a.born < 2.6);
    for (const a of arcs.current) {
      const [x1, y1, z1] = proj[a.from];
      const [x2, y2, z2] = proj[a.to];
      if (z1 < -0.15 || z2 < -0.15) continue;
      const mx = cx + ((x1 + x2) / 2 - cx) * 1.35;
      const my = cy + ((y1 + y2) / 2 - cy) * 1.35;
      const life = (t - a.born) / 2.6;
      const fade = life < 0.7 ? 1 : 1 - (life - 0.7) / 0.3;
      ctx.strokeStyle = `rgba(179,0,0,${0.55 * fade * strength})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(mx, my, x2, y2);
      ctx.stroke();
      const p = Math.min(1, life / 0.7);
      const qx = (1 - p) ** 2 * x1 + 2 * (1 - p) * p * mx + p * p * x2;
      const qy = (1 - p) ** 2 * y1 + 2 * (1 - p) * p * my + p * p * y2;
      ctx.fillStyle = `rgba(255,26,26,${0.9 * fade * strength})`;
      ctx.beginPath();
      ctx.arc(qx, qy, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [mobile, px, py, reduce, strength]);

  useEffect(() => {
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0;
    const resize = () => {
      w = el.clientWidth; h = el.clientHeight;
      el.width = w * dpr; el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(ctx, w, h, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    if (reduce) return () => window.removeEventListener("resize", resize);
    const loop = (t: number) => { draw(ctx, w, h, t / 1000); raf = requestAnimationFrame(loop); };
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [el, reduce, draw]);

  return <canvas ref={setEl} className="absolute inset-0 h-full w-full" />;
}

export function AmbientBackground() {
  const pathname = usePathname();
  const strength = pathname === "/" ? 1 : pathname?.startsWith("/game") ? 0.25 : 0.55;
  const [reduce, setReduce] = useState(false);
  const [mobile, setMobile] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const u = () => { setMobile(mq.matches); setReduce(rm.matches); };
    u();
    mq.addEventListener("change", u);
    rm.addEventListener("change", u);
    return () => { mq.removeEventListener("change", u); rm.removeEventListener("change", u); };
  }, []);

  const rx = useMotionValue(0), ry = useMotionValue(0);
  const px = useSpring(rx, { stiffness: 40, damping: 18 });
  const py = useSpring(ry, { stiffness: 40, damping: 18 });
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const on = (e: PointerEvent) => {
      rx.set((e.clientX / window.innerWidth - 0.5) * 2);
      ry.set((e.clientY / window.innerHeight - 0.5) * 2);
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, [reduce, rx, ry]);

  const { scrollY } = useScroll();
  const sphereY = useTransform(scrollY, (v) => Math.max(v * -0.15, -240));
  const fogY = useTransform(scrollY, (v) => Math.max(v * -0.05, -80));

  return (
    <div aria-hidden="true" className="mg-amb">
      <motion.div className="mg-amb-fog" style={{ y: reduce ? 0 : fogY }} />
      <motion.div className="absolute inset-0" style={{ y: reduce ? 0 : sphereY }}>
        <MemorySphere reduce={reduce} mobile={mobile} strength={strength} px={px} py={py} />
      </motion.div>
      <div className="mg-amb-vignette" />
    </div>
  );
}
