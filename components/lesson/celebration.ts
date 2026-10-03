// Čistá geometrie činky a text rozpisu XP pro oslavu (bez Reactu), pokryté testem v __tests__/celebration.test.ts.
import { plateSize } from '@/components/map/geometry';
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
  const parts = [`${t[xp.baseKind]} ${xp.base}`];
  if (xp.firstOfDay > 0) parts.push(`${t.first} +${xp.firstOfDay}`);
  if (xp.streak > 0) parts.push(`${t.streak} +${xp.streak}`);
  return parts.join(' · ');
}

/** Časová osa oslavy úrovně (a) v ms od dopadu pravého kotouče (motion spec §4.1). Patří do `lib/motion`
 *  jako `celebration.a`; do té doby (lib/* mimo motion-agenta) žije tady. */
export const TIMELINE_A = {
  dim: 0, dimMs: 240, center: 120, ring: 160, ringMs: 700, xp: 500, countMs: 650,
  seriesPlate: 900, pose: 950, scarfMs: 200, title: 1000, tomorrow: 1100, cta: 1200,
  /** Doběh na konečný stav při přeskočení. */
  skipMs: 150,
} as const;

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
