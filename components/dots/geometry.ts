// Čistá geometrie tečkového jazyka (Nothing Dot spec §2.4). Žádné React ani Skia: testovatelné a sdílené všemi Dot* komponentami.

export interface Dot { x: number; y: number; angle: number }
export interface PlateDot extends Dot { ring: number }

// Počet soustředných prstenců kotouče podle kg (spec §2.4): těžší kotouč = hustší.
const KG_RINGS: readonly (readonly [number, number])[] = [[25, 7], [20, 6], [15, 5], [10, 4], [5, 3], [2.5, 2]];
const MIN_RINGS = 2;
// Vnitřní prstenec leží na náboji R/φ² (stejná proporce jako dřívější litinový kotouč, SPEC §6.5).
export const HUB_RATIO = 1 / 2.618;
// Vnější prstenec má 48 teček; ostatní dostanou počet podle obvodu, aby rozteč zůstala stejná.
const OUTER_DOTS = 48;
const MIN_RING_DOTS = 8;

/** Nejbližší nižší hmotnost z tabulky; neznámé a menší hodnoty → 2 prstence. */
export function ringCountForKg(kg: number): number {
  for (const [k, n] of KG_RINGS) if (kg >= k) return n;
  return MIN_RINGS;
}

/** Tečky kotouče se středem v 0,0; ring 0 = vnější. Liché prstence pootočené o půl rozteče (včelí plástev). */
export function plateDots(kg: number, radius: number): PlateDot[] {
  const rings = ringCountForKg(kg);
  const inner = radius * HUB_RATIO;
  const step = (radius - inner) / (rings - 1);
  const pitch = (2 * Math.PI * radius) / OUTER_DOTS;
  const out: PlateDot[] = [];
  for (let ring = 0; ring < rings; ring++) {
    const r = radius - ring * step;
    const n = Math.max(MIN_RING_DOTS, Math.round((2 * Math.PI * r) / pitch));
    const offset = ring % 2 ? Math.PI / n : 0;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + offset;
      out.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r, ring, angle });
    }
  }
  return out;
}

/** `count` teček rovnoměrně po kruhu, první na úhlu `phase` (0 = vpravo, po směru hodin v souřadnicích obrazovky). */
export function ringDots(count: number, radius: number, phase = 0): Dot[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = phase + (i / count) * Math.PI * 2;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, angle };
  });
}

/** Které tečky řádku svítí: floor(total × fraction), fraction ořezaná do 0–1, NaN = nic. */
export function rowLit(total: number, fraction: number): boolean[] {
  const f = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
  const lit = Math.floor(total * f + 1e-9);
  return Array.from({ length: total }, (_, i) => i < lit);
}

/** Mřížka cols × rows s roztečí `pitch`, levý horní roh v 0,0, pořadí po řádcích. */
export function gridDots(cols: number, rows: number, pitch: number): { x: number; y: number; i: number }[] {
  const out: { x: number; y: number; i: number }[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: c * pitch, y: r * pitch, i: r * cols + c });
  return out;
}

/** Dotyková vlna: tečka ve vzdálenosti (dx, dy) od prstu se odsune od prstu (max `push`) a rozjasní (`boost` 0–1). */
export function rippleOffset(dx: number, dy: number, radius: number, push: number): { ox: number; oy: number; boost: number } {
  'worklet';
  const d = Math.hypot(dx, dy);
  if (d >= radius) return { ox: 0, oy: 0, boost: 0 };
  if (d === 0) return { ox: 0, oy: 0, boost: 1 };
  const t = 1 - d / radius;
  const k = (push * t) / d;
  return { ox: dx * k, oy: dy * k, boost: t };
}

/** Pořadí indexů pro nástup spirálou: prstence zvenku dovnitř, v prstenci podle úhlu 0 → 2π. */
export function spiralOrder<T extends { angle: number; ring?: number }>(dots: T[]): number[] {
  const norm = (a: number) => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  return dots
    .map((_, i) => i)
    .sort((a, b) => {
      const da = dots[a]!, db = dots[b]!;
      return (da.ring ?? 0) - (db.ring ?? 0) || norm(da.angle) - norm(db.angle);
    });
}

/** Rozteč, při které celá plocha `w × h` vejde pod strop `max` (nikdy hustší než `base`). */
export function backgroundPitch(w: number, h: number, base: number, max: number): number {
  if (w <= 0 || h <= 0) return base;
  // (w/p + 1)(h/p + 1) ≤ max  →  odhad z plochy, pak dorovnat po kroku, dokud se nevejde.
  let p = Math.max(base, Math.sqrt((w * h) / max));
  while ((Math.floor(w / p) + 1) * (Math.floor(h / p) + 1) > max) p += 0.5;
  return p;
}
