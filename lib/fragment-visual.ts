import type { Fragment } from "./types";

export interface FragmentVisual {
  primaryColor: string;
  secondaryColor: string;
  pattern: "geometric" | "organic" | "noise" | "minimal" | "chaotic";
  intensity: number;
  svgContent: string;
}

function seededRng(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function toneToColor(tone: number): [string, string] {
  if (tone <= 3) return [`hsl(210, 50%, ${25 + tone * 3}%)`, `hsl(220, 40%, ${35 + tone * 2}%)`];
  if (tone <= 6) return [`hsl(35, 50%, ${25 + (tone - 3) * 4}%)`, `hsl(30, 40%, ${35 + (tone - 3) * 3}%)`];
  return [`hsl(0, 45%, ${22 + (tone - 6) * 3}%)`, `hsl(350, 35%, ${30 + (tone - 6) * 2}%)`];
}

function getPattern(tagCount: number): FragmentVisual["pattern"] {
  if (tagCount <= 1) return "minimal";
  if (tagCount <= 3) return "geometric";
  if (tagCount <= 5) return "organic";
  return "chaotic";
}

export function generateFragmentVisual(fragment: Fragment): FragmentVisual {
  const rng = seededRng(fragment.id * 7919 + fragment.toneScore * 31);
  const [primary, secondary] = toneToColor(fragment.toneScore);
  const pattern = getPattern(fragment.tags.length);
  const shapeCount = pattern === "minimal" ? 5 : pattern === "geometric" ? 8 : pattern === "organic" ? 10 : 15;

  let shapes = "";

  for (let i = 0; i < shapeCount; i++) {
    const x = rng() * 200;
    const y = rng() * 120;
    const size = 5 + rng() * 25;
    const opacity = 0.1 + rng() * 0.25;
    const color = rng() > 0.5 ? primary : secondary;

    if (pattern === "minimal") {
      const x2 = rng() * 200;
      const y2 = rng() * 120;
      shapes += `<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${0.5 + rng()}" opacity="${opacity}" />`;
    } else if (pattern === "geometric") {
      if (rng() > 0.5) {
        shapes += `<circle cx="${x}" cy="${y}" r="${size / 2}" fill="none" stroke="${color}" stroke-width="${0.5 + rng() * 0.5}" opacity="${opacity}" />`;
      } else {
        shapes += `<rect x="${x}" y="${y}" width="${size}" height="${size * (0.5 + rng())}" fill="none" stroke="${color}" stroke-width="${0.5 + rng() * 0.5}" opacity="${opacity}" rx="1" />`;
      }
    } else if (pattern === "organic") {
      const cx1 = x + (rng() - 0.5) * 40;
      const cy1 = y + (rng() - 0.5) * 30;
      const ex = rng() * 200;
      const ey = rng() * 120;
      shapes += `<path d="M ${x} ${y} Q ${cx1} ${cy1} ${ex} ${ey}" fill="none" stroke="${color}" stroke-width="${0.5 + rng()}" opacity="${opacity}" />`;
    } else {
      const points = Array.from({ length: 3 + Math.floor(rng() * 3) }, () => `${x + (rng() - 0.5) * size * 2},${y + (rng() - 0.5) * size * 2}`).join(" ");
      shapes += `<polygon points="${points}" fill="${color}" opacity="${opacity * 0.5}" />`;
    }
  }

  const svgContent = `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="120" fill="#0a0a0a" />${shapes}</svg>`;

  return { primaryColor: primary, secondaryColor: secondary, pattern, intensity: fragment.toneScore / 10, svgContent };
}
