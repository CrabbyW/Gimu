// Worklety tečkového pohybu (motion-agent): dotyková vlna, vlna od středu a nástupy skenem/spirálou.
// Čisté funkce nad poli bodů: běží na UI vlákně v `useDerivedValue`, testovatelné i v Node.
import { rippleOffset } from './geometry';

export interface Pt { x: number; y: number }

/** O kolik se poloměr vlny rozšíří, než dozní (vlna se po puštění „rozběhne“ a vyprchá). */
export const RIPPLE_SPREAD = 0.6;
/** Od jakého `boost` se tečka kreslí do rozjasněné vrstvy. */
const LIT_FROM = 0.3;

/** Dotyková vlna: posune tečky od prstu (max `push` × síla) a vrátí i podmnožinu rozjasněných.
 *  Bez síly vrací vstupní pole (stejné reference, nic se nealokuje). */
export function ripplePoints(base: readonly Pt[], tx: number, ty: number, s: number, radius: number, push: number): { pts: readonly Pt[]; lit: Pt[] } {
  'worklet';
  if (s <= 0.001) return { pts: base, lit: [] };
  const R = radius * (1 + (1 - s) * RIPPLE_SPREAD);
  const pts: Pt[] = new Array(base.length);
  const lit: Pt[] = [];
  for (let i = 0; i < base.length; i++) {
    const p = base[i]!;
    const r = rippleOffset(p.x - tx, p.y - ty, R, push * s);
    const q = r.boost > 0 ? { x: p.x + r.ox, y: p.y + r.oy } : p;
    pts[i] = q;
    if (r.boost > LIT_FROM) lit.push(q);
  }
  return { pts, lit };
}

/** Vlna od středu (oslava): prstenec poloměru `front` a šířky `band` tečky rozjasní a odsune ven o `push`. */
export function wavePoints(base: readonly Pt[], cx: number, cy: number, front: number, band: number, push: number): { pts: readonly Pt[]; lit: Pt[] } {
  'worklet';
  if (front <= 0) return { pts: base, lit: [] };
  const pts: Pt[] = new Array(base.length);
  const lit: Pt[] = [];
  for (let i = 0; i < base.length; i++) {
    const p = base[i]!;
    const dx = p.x - cx;
    const dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    const b = 1 - Math.abs(d - front) / band;
    if (b <= 0 || d === 0) { pts[i] = p; continue; }
    const k = (push * b) / d;
    const q = { x: p.x + dx * k, y: p.y + dy * k };
    pts[i] = q;
    if (b > LIT_FROM) lit.push(q);
  }
  return { pts, lit };
}

/** Kolik teček z `n` svítí při průběhu nástupu `p` 0–1 (celé tečky; poslední rozsvícená je `frac`). */
export function scanCount(p: number, n: number): { whole: number; frac: number } {
  'worklet';
  const v = Math.min(1, Math.max(0, p)) * n;
  const whole = Math.floor(v + 1e-6);
  return { whole, frac: v - whole };
}

/** Pořadí skenu zleva: indexy podle x, při shodě podle y (sloupec po sloupci). */
export function scanOrder(pts: readonly Pt[]): number[] {
  return pts.map((_, i) => i).sort((a, b) => pts[a]!.x - pts[b]!.x || pts[a]!.y - pts[b]!.y);
}

/** Bod natočený o úhel `a` kolem (cx, cy). Pro převod prstu do soustavy otočeného kotouče (s −a). */
export function rotateAround(x: number, y: number, cx: number, cy: number, a: number): Pt {
  'worklet';
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = x - cx;
  const dy = y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

/**
 * Let tečky z pole do kotouče (oslava): polární interpolace kolem středu s pootočením `twist`, takže dráha je
 * spirála. `t` 0–1 (už s easingem). Start `from`, cíl `to`, obojí vůči středu.
 */
export function spiralLerp(from: Pt, to: Pt, t: number, twist: number): Pt {
  'worklet';
  const r0 = Math.hypot(from.x, from.y);
  const r1 = Math.hypot(to.x, to.y);
  const a0 = Math.atan2(from.y, from.x);
  // Cíl se posune o celé otáčky tak, aby tečka opsala zhruba `twist` (± π), všechny stejným směrem.
  const raw = Math.atan2(to.y, to.x);
  const a1 = raw + Math.PI * 2 * Math.round((a0 - raw - twist) / (Math.PI * 2));
  const r = r0 + (r1 - r0) * t;
  const a = a0 + (a1 - a0) * t;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
}
