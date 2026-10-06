// Rozvržení tabu Progres (Nothing Dot fáze 2, Task 4): čisté funkce bez Reactu.

/** Mřížka aktivity: 5 týdnů × 7 dní. */
export const ACTIVITY_CELLS = 35;
/** Od této šířky (pt) a do tohoto zvětšení písma se dlaždice skládají do dvou sloupců. */
const TWO_COLUMN_MIN_WIDTH = 360;
const TWO_COLUMN_MAX_FONT_SCALE = 1.3;

/** Dva sloupce dlaždic (obr. 2), na úzkém displeji nebo s velkým písmem jeden. */
export function tileColumns(width: number, fontScale: number): 1 | 2 {
  return width >= TWO_COLUMN_MIN_WIDTH && fontScale <= TWO_COLUMN_MAX_FONT_SCALE ? 2 : 1;
}

/** Posledních 35 dní do `DotMatrix`: kratší historie se zleva doplní zhasnutými, delší ořízne.
 *  `todayIndex` je index v hotové mřížce; mimo rozsah = žádný dnešek. */
export function activityCells(
  days: readonly { date: string; active: boolean }[], todayIndex: number | null,
): { lit: boolean[]; today: number | undefined } {
  const recent = days.slice(-ACTIVITY_CELLS).map((d) => d.active);
  const lit = [...Array<boolean>(ACTIVITY_CELLS - recent.length).fill(false), ...recent];
  const today = todayIndex != null && todayIndex >= 0 && todayIndex < ACTIVITY_CELLS ? todayIndex : undefined;
  return { lit, today };
}
