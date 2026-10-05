// Čistá geometrie mapy (bez Reactu), pokrytá testem v logic/__tests__/geometry.test.ts.
import { PHI, size as sz, space, stroke, type as t } from '@/theme/tokens';
import type { NodeState } from '@/logic/map';
import type { PlateKg } from '@/types';

/** Velikost kotouče podle kg: na mapě se už nepoužívá (Teplá litina, velikost nese stav), zůstává
 *  pro proporce kotouče v oslavě lekce (`components/lesson/celebration.ts`). */
const SIZES: Record<PlateKg, number> = { 5: 56, 10: 60, 15: 64, 20: 72, 25: 80 };
export const plateSize = (kg: PlateKg) => SIZES[kg];
export const BOSS_SIZE = { w: 220, h: 88 };
/** Teplá litina §2.7: všechny kotouče 72, aktuální 88 (velikost nese stav, ne kg). */
export const nodeSize = (current: boolean) => (current ? sz.nodeCurrent : sz.node);
// R43: minimální krok uzlů = 64·φ (token xxxl), amplituda sinusoidy = šířka/φ³.
const STEP = space.xxxl;
const GUTTER = space.m;
/** Prostor nad prvním uzlem sekce pro mono nadpis (řádek 14 + odstup). */
export const SECTION_ROOM = space.xl;
/** Odstup nadpisu sekce nad horní hranou uzlu (včetně opičky). */
export const SECTION_LABEL_OFFSET = space.l + space.s;
/** Opička (S 56) sedí na horní hraně aktuálního kotouče: nad hranou vyčnívá zhruba 5/8 její výšky. */
export const MONKEY_ROOM = space.xl;
/** Prstenec aktuálního uzlu: mezera 4 + tah 2 vně kotouče. */
export const RING_OUT = sz.nodeRingGap + stroke.nodeRing;
/** Odstup popisku od spodní hrany kotouče (za prstencem). */
export const LABEL_GAP = RING_OUT + space.xs;

export type LayoutState = NodeState;
export interface LayoutInput { id: string; isBoss: boolean; state: LayoutState; sectionStart: boolean }
/** `top` = nejvyšší bod uzlu včetně opičky (pro nadpis sekce). */
export interface NodePosition { id: string; x: number; y: number; size: number; top: number }

/** Výška popisku pod uzlem při 1.0× písmu: current = název (až 2 řádky headline) + metadata
 *  (Nothing Dot: akci nese plovoucí pilulka obrazovky, ne tlačítko u uzlu), locked = název + metadata,
 *  done = jen název, boss = headline + podmínka. */
export function labelHeight(state: LayoutState, isBoss: boolean): number {
  if (state === 'current') return t.headline.lineHeight * 2 + t.caption.lineHeight;
  if (isBoss) return t.headline.lineHeight + t.caption.lineHeight;
  if (state === 'locked') return t.caption.lineHeight * 2;
  return t.caption.lineHeight;
}

const extents = (n: LayoutInput) => {
  const size = n.isBoss ? BOSS_SIZE.h : nodeSize(n.state === 'current');
  const ring = n.state === 'current' ? RING_OUT : 0;
  const up = size / 2 + Math.max(ring, n.state === 'current' && !n.isBoss ? MONKEY_ROOM : 0);
  const down = size / 2 + LABEL_GAP + labelHeight(n.state, n.isBoss);
  return { size, up, down };
};

/** Uzly shora dolů po sinusoidě (amplituda šířka/φ³ ≈ 24 %), boss na středu. Svislý krok je aspoň 64·φ,
 *  ale roste tak, aby se popisek uzlu (a tlačítko aktuálního) nepřekrýval s opičkou a kotoučem dalšího uzlu. */
export function layoutNodes(nodes: LayoutInput[], width: number) {
  const cx = width / 2;
  const amp = Math.min(width / PHI ** 3, 120);
  const positions: NodePosition[] = [];
  let prev: { y: number; down: number } | null = null;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]!;
    const e = extents(n);
    const half = n.isBoss ? BOSS_SIZE.w / 2 : e.size / 2;
    const raw = n.isBoss ? cx : cx + Math.sin(i * 0.9) * amp;
    const x = Math.min(Math.max(raw, GUTTER + half), width - GUTTER - half);
    const room = n.sectionStart ? SECTION_ROOM : 0;
    const y: number = prev === null
      ? space.l + SECTION_ROOM + e.up
      : Math.max(prev.y + STEP, prev.y + prev.down + space.l + room + e.up);
    positions.push({ id: n.id, x, y, size: e.size, top: y - e.up });
    prev = { y, down: e.down };
  }
  return { positions, height: (prev ? prev.y + prev.down : 0) + space.xxl };
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

export type PopoverSide = 'above' | 'below';

/** Strana popoveru u uzlu. Dokončený uzel otevírá kartu nad sebou, pryč od následujícího (aktuálního)
 *  uzlu a opice, která sedí vedle něj; ostatní pod sebou. Když se preferovaná strana nevejde do
 *  výřezu (a do mapy), zkusí druhou; když ani ta, vezme stranu s víc místem. */
export function popoverSide(o: {
  done: boolean;
  nodeTop: number;
  nodeBottom: number;
  viewportTop: number;
  viewportBottom: number;
  room: number;
}): PopoverSide {
  const spaceAbove = o.nodeTop - Math.max(o.viewportTop, 0);
  const spaceBelow = o.viewportBottom - o.nodeBottom;
  const fits = (s: PopoverSide) => (s === 'above' ? spaceAbove : spaceBelow) >= o.room;
  const preferred: PopoverSide = o.done ? 'above' : 'below';
  const other: PopoverSide = o.done ? 'below' : 'above';
  if (fits(preferred)) return preferred;
  if (fits(other)) return other;
  return spaceAbove > spaceBelow ? 'above' : 'below';
}
