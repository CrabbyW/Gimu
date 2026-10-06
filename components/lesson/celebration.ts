// Čistá geometrie činky a text rozpisu XP pro oslavu (bez Reactu), pokryté testem v __tests__/celebration.test.ts.
import { plateSize } from '@/components/map/geometry';
import { lessonDone, motion } from '@/lib/motion';
import type { HapticKind } from '@/lib/haptics';
import type { XpBreakdown } from '@/logic/xp';
import type { PlateKg } from '@/types';

export const BARBELL_H = 180;
/** Osa: výška 8, horní hrana y = 86, střed y = 90. Kotouče i objímky jsou na ni vycentrované. */
export const AXIS = { y: 86, h: 8, mid: 90 } as const;
export const COLLAR = { w: 14, h: 28 } as const;
/** O kolik objímka před zacvaknutím stojí dál od kotoučů. */
export const COLLAR_TRAVEL = 16;
/** Vnitřní doraz: první kotouč začíná tolik od středu osy. */
const INNER = 10;
const GAP = 1;

const WIDTHS: Record<PlateKg, number> = { 5: 10, 10: 12, 15: 14, 20: 16, 25: 18 };
export const plateWidth = (kg: PlateKg) => WIDTHS[kg];
export const plateHeight = (kg: PlateKg) => Math.round(plateSize(kg) * 1.9);

/** Kotouč na jedné straně osy: `offset` je vzdálenost jeho vnitřní hrany od středu. */
export interface PlacedPlate { kg: PlateKg; offset: number; w: number; h: number }
/** `sleeveOffset`: kde od středu začíná objímka osy (vnitřní doraz + silnější konec osy). */
export interface BarbellLayout { loaded: PlacedPlate[]; flying: PlacedPlate; collarOffset: number; sleeveOffset: number }

/** Vnitřní doraz osy (tloušťka v pt) a kolik osy zbude za vnější objímkou. */
export const SLEEVE = { stopW: 6, stopH: 34, h: 12, end: 14 } as const;
/** Doraz sedí na ~45 % poloviny osy jako u skutečné olympijské osy (úchop uprostřed, kotouče na koncích). */
const SLEEVE_AT = 0.45;

/** Nasazené kotouče od dorazu ven, přilétající hned za nimi, objímka těsně za ním.
 *  S `half` (polovina šířky osy) se doraz posune ke konci osy, dokud se kotouče vejdou. */
export function barbellLayout(loaded: readonly PlateKg[], flyingKg: PlateKg, half?: number): BarbellLayout {
  const stack = [...loaded, flyingKg].reduce((sum, kg) => sum + plateWidth(kg) + GAP, 0);
  const sleeveOffset = half == null
    ? INNER - SLEEVE.stopW
    : Math.max(INNER - SLEEVE.stopW, Math.min(Math.round(half * SLEEVE_AT), half - SLEEVE.stopW - stack - COLLAR.w - SLEEVE.end));
  let offset = sleeveOffset + SLEEVE.stopW;
  const place = (kg: PlateKg): PlacedPlate => {
    const p = { kg, offset, w: plateWidth(kg), h: plateHeight(kg) };
    offset += p.w + GAP;
    return p;
  };
  const placed = loaded.map(place);
  const flying = place(flyingKg);
  return { loaded: placed, flying, collarOffset: offset, sleeveOffset };
}

/** Rozdělí kotouče sekce na nasazené a přilétající. Přilétá kotouč lekce; u nové lekce je to
 *  poslední z `completedPlates`, u opakování a bosse se z nasazených ubere jeho výskyt, pokud tam je,
 *  aby počet kotoučů na ose odpovídal stavu sekce. */
export function splitPlates(completedPlates: readonly PlateKg[], lessonKg: PlateKg): { loaded: PlateKg[]; flying: PlateKg } {
  const loaded = [...completedPlates];
  const i = loaded.lastIndexOf(lessonKg);
  if (i !== -1) loaded.splice(i, 1);
  return { loaded, flying: lessonKg };
}

export interface XpLabels { lesson: string; boss: string; replay: string; first: string; streak: string }

/** „lekce 20 · první dnes +10 · streak +2“; nulové bonusy se vynechají. Velká písmena dělá styl label. */
export function xpBreakdownLabel(xp: XpBreakdown, t: XpLabels): string {
  // Uvnitř položky nezlomitelné mezery: „streak +14“ se nesmí rozdělit na dva řádky (zalomí se jen mezi položkami).
  const nb = (s: string) => s.replace(/ /g, ' ');
  const parts = [nb(`${t[xp.baseKind]} ${xp.base}`)];
  if (xp.firstOfDay > 0) parts.push(nb(`${t.first} +${xp.firstOfDay}`));
  if (xp.streak > 0) parts.push(nb(`${t.streak} +${xp.streak}`));
  return parts.join(' · ');
}


export const MAX_XP_TICKS = 8;

/** Krok count-upu tak, aby ticků (zobrazených mezihodnot včetně poslední) bylo nejvýš `max`. */
export function xpTickStep(total: number, max: number = MAX_XP_TICKS): number {
  return Math.max(1, Math.ceil(Math.max(0, total) / max));
}

/** Hodnota zobrazená po `k`-tém ticku (poslední tick ukáže přesně `total`). */
export const xpTickValue = (k: number, total: number, step: number) => Math.min(total, Math.max(0, k) * step);

/** Hodnoty, které count-up postupně ukáže (pro test stropu ticků). */
export function xpTickValues(total: number, max: number = MAX_XP_TICKS): number[] {
  const step = xpTickStep(total, max);
  const out: number[] = [];
  for (let k = 1; xpTickValue(k - 1, total, step) < total; k++) out.push(xpTickValue(k, total, step));
  return out;
}

/** Idempotentní brána: `run` provede akci jen poprvé, další volání nedělají nic (`skipToEnd`, cleanup). */
export function once(fn: () => void): { run(): void; readonly done: boolean } {
  let done = false;
  return {
    run() { if (done) return; done = true; fn(); },
    get done() { return done; },
  };
}

// ── Nothing Dot: oslava z teček (spec §5) ──

export type CelebrationStepId = 'field' | 'gather' | 'snap' | 'mascot' | 'cta';
export interface CelebrationStep { id: CelebrationStepId; at: number; durationMs: number }

/** Délka nacvaknutí kotouče (pružina `spring.kotouc` z 1.08 dosedne zhruba za tuto dobu). */
const SNAP_MS = 240;

/**
 * Časová osa oslavy dokončení lekce v ms od zobrazení scény, v pořadí field → gather → snap → mascot → cta
 * (hodnoty z `lessonDone`). Omezený pohyb: všechno hned (`at` 0) jedním prolnutím `reducedMs` (200 ms).
 */
export function celebrationTimeline(reduced: boolean): CelebrationStep[] {
  const L = lessonDone;
  const steps: CelebrationStep[] = [
    { id: 'field', at: L.fieldAt, durationMs: L.fieldMs },
    { id: 'gather', at: L.gatherAt, durationMs: L.gatherMs },
    { id: 'snap', at: L.snapAt, durationMs: SNAP_MS },
    { id: 'mascot', at: L.mascotAt, durationMs: L.countMs },
    { id: 'cta', at: L.ctaAt, durationMs: motion.reveal.duration },
  ];
  return reduced ? steps.map((s) => ({ ...s, at: 0, durationMs: L.reducedMs })) : steps;
}

/** Haptický podpis dokončení lekce v ms od zobrazení scény (odlišný od ostatních success v appce):
 *  crescendo tiků při slétání teček (zrychlují: odstupy ∝ odmocnině, selection → light), heavy v nacvaknutí,
 *  notifikace success, a po doběhu XP dvojitý „heartbeat“ medium → light. Omezený pohyb: jen success. */
export function celebrationHaptics(reduced: boolean): [number, HapticKind][] {
  const L = lessonDone;
  if (reduced) return [[0, 'success']];
  const C = L.crescendo;
  const out: [number, HapticKind][] = [];
  for (let j = 0; j < C.ticks; j++) {
    const f = C.from + (C.to - C.from) * Math.sqrt(j / Math.max(1, C.ticks - 1));
    out.push([Math.round(L.gatherAt + L.gatherMs * f), j < C.lightFrom ? 'selection' : 'light']);
  }
  const xpEnd = L.mascotAt + L.countMs;
  out.push([L.snapAt, 'heavy'], [L.snapAt + L.successAfterSnap, 'success'], [xpEnd, 'medium'], [xpEnd + L.heartbeatGap, 'light']);
  return out;
}

/** Krok osy podle id (osa je úplná, krok vždy existuje). */
export const stepOf = (tl: readonly CelebrationStep[], id: CelebrationStepId) => tl.find((s) => s.id === id)!;

/** Mřížka pole teček scény: počátek a rozteč (stejný výpočet jako `DotField` bez doznívání). */
export interface FieldGrid { left: number; top: number; pitch: number; cols: number; rows: number }

/** Mřížka `DotField` (fade „none“, strop `max` teček) pro plochu width × height. */
export function fieldGrid(width: number, height: number, pitch: number, max: number): FieldGrid {
  const cols = Math.floor(width / pitch) + 1;
  const allRows = Math.floor(height / pitch) + 1;
  const rows = Math.max(1, Math.min(allRows, Math.floor(max / cols)));
  return { left: (width - (cols - 1) * pitch) / 2, top: (height - (allRows - 1) * pitch) / 2, pitch, cols, rows };
}

/**
 * Odkud tečky kotouče vzlétnou: pro každou cílovou tečku (vůči středu kotouče) bod mřížky pole ve stejném
 * směru, v mezikruží mezi `inner` × poloměr a nejbližším okrajem pole (vnější prstenec startuje nejdál,
 * drobný rozptyl podle indexu), zaokrouhlený na nejbližší tečku pole. Mezikruží se vejde do pole, takže
 * starty netvoří hranatý rám u okraje. Výsledek je vůči středu kotouče (`cx`, `cy` v souřadnicích pole).
 */
export function gatherSources(
  targets: readonly { x: number; y: number; ring: number }[], radius: number, rings: number,
  cx: number, cy: number, grid: FieldGrid, inner = 1.3,
): { x: number; y: number }[] {
  const right = grid.left + (grid.cols - 1) * grid.pitch;
  const bottom = grid.top + (grid.rows - 1) * grid.pitch;
  const near = radius * inner;
  const far = Math.max(near + grid.pitch, Math.min(cx - grid.left, right - cx, cy - grid.top, bottom - cy) - grid.pitch);
  const snap = (v: number, o: number, n: number) => o + Math.max(0, Math.min(n - 1, Math.round((v - o) / grid.pitch))) * grid.pitch;
  return targets.map((t, i) => {
    const a = Math.atan2(t.y, t.x);
    const k = (1 - t.ring / Math.max(1, rings)) * 0.75 + ((i * 7) % 5) / 5 * 0.25;
    const d = near + (far - near) * k;
    const gx = snap(cx + Math.cos(a) * d, grid.left, grid.cols);
    const gy = snap(cy + Math.sin(a) * d, grid.top, grid.rows);
    return { x: gx - cx, y: gy - cy };
  });
}
