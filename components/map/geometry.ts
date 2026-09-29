// Čistá geometrie mapy (bez Reactu), pokrytá testem v logic/__tests__/geometry.test.ts.
import type { PlateKg } from '@/types';

const SIZES: Record<PlateKg, number> = { 5: 56, 10: 60, 15: 64, 20: 72, 25: 80 };
export const plateSize = (kg: PlateKg) => SIZES[kg];
export const BOSS_SIZE = { w: 220, h: 88 };
const STEP = 112;
const TOP = 96;
const GUTTER = 16;

export interface NodePosition { id: string; x: number; y: number; size: number }

/** Uzly shora dolů po sinusoidě (amplituda ~28 % šířky), boss na středu. */
export function layoutNodes(nodes: { id: string; plateKg: PlateKg; isBoss: boolean }[], width: number) {
  const cx = width / 2;
  const amp = Math.min(width * 0.28, 120);
  const positions: NodePosition[] = nodes.map((n, i) => {
    const size = n.isBoss ? BOSS_SIZE.h : plateSize(n.plateKg);
    const half = n.isBoss ? BOSS_SIZE.w / 2 : size / 2;
    const raw = n.isBoss ? cx : cx + Math.sin(i * 0.9) * amp;
    const x = Math.min(Math.max(raw, GUTTER + half), width - GUTTER - half);
    return { id: n.id, x, y: TOP + i * STEP + (n.isBoss ? 24 : 0), size };
  });
  return { positions, height: (positions.at(-1)?.y ?? 0) + 160 };
}

/** Kubická Bézierova křivka mezi dvěma středy, kontrolní body svisle v polovině mezery. */
export function segmentPath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const my = (a.y + b.y) / 2;
  return `M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`;
}

/** Délka úseku `segmentPath` (vzorkováním), pro animaci dokreslení přes strokeDashoffset. */
export function segmentLength(a: { x: number; y: number }, b: { x: number; y: number }, samples = 32): number {
  const my = (a.y + b.y) / 2;
  const at = (t: number) => {
    const u = 1 - t;
    // Bernstein pro body a, (a.x,my), (b.x,my), b.
    const x = u * u * u * a.x + 3 * u * u * t * a.x + 3 * u * t * t * b.x + t * t * t * b.x;
    const y = u * u * u * a.y + 3 * u * u * t * my + 3 * u * t * t * my + t * t * t * b.y;
    return { x, y };
  };
  let len = 0;
  let p = at(0);
  for (let i = 1; i <= samples; i++) { const q = at(i / samples); len += Math.hypot(q.x - p.x, q.y - p.y); p = q; }
  return len;
}
