// Prohlídka mapy pro nového uživatele (směr „Opička ukazuje“): scrim, jeden prvek ve výřezu, opička s větou.
// Čistá logika kroků a rozmístění; měření a kreslení dělá `components/map/MapTour`.

export type TourStepId = 'plate' | 'streak' | 'progress' | 'start';
export interface TourRect { x: number; y: number; width: number; height: number }

/** Pořadí kroků. Bez aktuální lekce (vše hotovo) kotouč a Start chybí — ukážeme jen to, co na mapě je. */
export function tourSteps(hasCurrentLesson: boolean): TourStepId[] {
  return hasCurrentLesson ? ['plate', 'streak', 'progress', 'start'] : ['streak', 'progress'];
}

/** Ťuknutí = další krok; za posledním (nebo SKIP) konec → `null`. */
export function nextTourStep(index: number, total: number): number | null {
  return index + 1 < total ? index + 1 : null;
}

/** Id průvodců, která tutorial zapíše jako viděná: nahrazuje i starou bublinu „Tap Start to begin“. */
export const TOUR_SEEN_IDS = ['mapTour', 'mapStart'] as const;

/** Výřez kolem prvku: odsazení `pad`, oříznuté do obrazovky s okrajem `edge` (tečkový obrys nesmí ujet za hranu). */
export function spotlightRect(r: TourRect, pad: number, screenW: number, screenH: number, edge = 0): TourRect {
  const x = Math.max(edge, r.x - pad);
  const y = Math.max(edge, r.y - pad);
  return { x, y, width: Math.min(screenW - edge, r.x + r.width + pad) - x, height: Math.min(screenH - edge, r.y + r.height + pad) - y };
}

/** Opička s bublinou pod prvkem, když je prvek v horní polovině, jinak nad ním. */
export function tourPlacement(hole: TourRect, screenH: number): 'below' | 'above' {
  return hole.y + hole.height / 2 < screenH / 2 ? 'below' : 'above';
}

/** Ovládání (tečky 1/4 + SKIP) stojí dole v pásu tab baru (během prohlídky neaktivní, nic nezakrývá);
 *  nahoru jen tehdy, když výřez sahá do spodního pásu `band`. Nahoře by se srazilo se stavovým řádkem. */
export function controlsAt(hole: TourRect, screenH: number, band: number): 'top' | 'bottom' {
  return hole.y + hole.height > screenH - band ? 'top' : 'bottom';
}

/** Opička vedle malého cíle (kotouč), pokud se tam vejde (`need` = opička + okraje); jinak nad/pod ním. */
export function mascotSide(hole: TourRect, screenW: number, need: number): 'right' | 'left' | null {
  if (screenW - (hole.x + hole.width) >= need) return 'right';
  if (hole.x >= need) return 'left';
  return null;
}
