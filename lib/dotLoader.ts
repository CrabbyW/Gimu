// Čisté funkce pro DotLoader (port shadcn @dotmatrix `dotm-square-11` „Echo Ring“).
// Vše je worklet: stejný kód běží v UI threadu (useAnimatedStyle) i v Jest testech.
// Bez importu reanimated, aby šly funkce testovat v Jestu čistě.

/** Strana mřížky originálu (MATRIX_SIZE = 5, vzor "full": všech 25 teček aktivních). */
export const DOT_GRID = 5;
const N = DOT_GRID;
const CENTER = Math.floor(N / 2);
const MAX_RING = 4;

/** Kruh (0–4) = Manhattanova vzdálenost buňky od středu mřížky 5×5. */
export function ringOf(index: number): number {
  'worklet';
  const row = Math.floor(index / N);
  const col = index % N;
  return Math.max(0, Math.min(MAX_RING, Math.abs(row - CENTER) + Math.abs(col - CENTER)));
}

/** Statická opacita při omezení pohybu (originál: 0.2 + (1 - ring/4) * 0.72). */
export function staticOpacity(ring: number): number {
  'worklet';
  return 0.2 + (1 - ring / MAX_RING) * 0.72;
}

/** Zpoždění kruhu jako zlomek cyklu (originál: ring * 0.14 + parita * 0.03). */
export function echoDelay(ring: number): number {
  'worklet';
  return ring * 0.14 + (ring % 2) * 0.03;
}

const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

// Zdrojová trojice, ze které originál přemapovává statickou opacitu na opacityBase/Mid/Peak.
const SRC_BASE = 0.08;
const SRC_MID = 0.34;
const SRC_PEAK = 0.94;

/** `remapOpacityToTriplet` z originálu: bez override vrací opacitu beze změny. */
export function remapOpacity(opacity: number, base?: number, mid?: number, peak?: number): number {
  'worklet';
  const o = clamp01(opacity);
  if (base === undefined && mid === undefined && peak === undefined) return o;
  const b = base === undefined ? SRC_BASE : clamp01(base);
  const m = mid === undefined ? SRC_MID : clamp01(mid);
  const p = peak === undefined ? SRC_PEAK : clamp01(peak);
  const seg = (v: number, s: number, e: number, from: number, to: number) => {
    'worklet';
    const t = e - s <= 0 ? 0 : clamp01((v - s) / (e - s));
    return clamp01(from + (to - from) * t);
  };
  if (o <= SRC_BASE) return seg(o, 0, SRC_BASE, 0, b);
  if (o <= SRC_MID) return seg(o, SRC_BASE, SRC_MID, b, m);
  if (o <= SRC_PEAK) return seg(o, SRC_MID, SRC_PEAK, m, p);
  return seg(o, SRC_PEAK, 1, p, 1);
}

/** Úroveň záře pro statickou opacitu (originál: od 0.6 lineárně do 1). */
export function staticBloomLevel(remapped: number): number {
  'worklet';
  return clamp01((remapped - 0.6) / 0.4);
}

/** CSS `ease-in-out` = cubic-bezier(0.42, 0, 0.58, 1), řešeno Newtonem. */
export function easeInOut(x: number): number {
  'worklet';
  const x1 = 0.42, x2 = 0.58, y1 = 0, y2 = 1;
  const bx = (t: number, a: number, b: number) => {
    'worklet';
    return 3 * (1 - t) * (1 - t) * t * a + 3 * (1 - t) * t * t * b + t * t * t;
  };
  let t = x;
  for (let i = 0; i < 8; i++) {
    const d = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
    if (Math.abs(d) < 1e-6) break;
    t = clamp01(t - (bx(t, x1, x2) - x) / d);
  }
  return bx(t, y1, y2);
}

/** Opacita keyframů `dmx-ripple-echo` ve fázi 0–1 (každý úsek má vlastní ease-in-out jako v CSS). */
export function echoOpacity(phase: number, base: number, mid: number, peak: number): number {
  'worklet';
  const rest = 0.625 * base;
  const echo = 0.68 * peak + 0.32 * mid;
  const p = phase - Math.floor(phase);
  const seg = (s: number, e: number, from: number, to: number) => {
    'worklet';
    return from + (to - from) * easeInOut((p - s) / (e - s));
  };
  if (p <= 0.28) return seg(0, 0.28, rest, 0.98 * peak);
  if (p <= 0.56) return seg(0.28, 0.56, 0.98 * peak, mid);
  if (p <= 0.78) return seg(0.56, 0.78, mid, echo);
  return seg(0.78, 1, echo, rest);
}

/** `--dmx-bloom-level` není registrovaná CSS proměnná, animuje se skokem v půlce úseku:
 *  0.9 mezi 14 % a 42 % cyklu, jinak 0. */
export function echoBloom(phase: number): number {
  'worklet';
  const p = phase - Math.floor(phase);
  return p >= 0.14 && p < 0.42 ? 0.9 : 0;
}
