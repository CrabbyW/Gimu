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
export interface BarbellLayout { loaded: PlacedPlate[]; flying: PlacedPlate; collarOffset: number }

/** Nasazené kotouče od středu ven, přilétající hned za nimi, objímka těsně za ním. */
export function barbellLayout(loaded: readonly PlateKg[], flyingKg: PlateKg): BarbellLayout {
  let offset = INNER;
  const place = (kg: PlateKg): PlacedPlate => {
    const p = { kg, offset, w: plateWidth(kg), h: plateHeight(kg) };
    offset += p.w + GAP;
    return p;
  };
  const placed = loaded.map(place);
  const flying = place(flyingKg);
  return { loaded: placed, flying, collarOffset: offset };
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
