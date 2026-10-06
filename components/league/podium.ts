// Pódium ligy z teček (Nothing Dot fáze 2, Task 3): čistá geometrie bez Reactu.

export type PodiumRank = 1 | 2 | 3;
export interface PodiumColumn { rank: PodiumRank; order: number; dots: number }

/** Výška sloupce v tečkách: vítěz nejvyšší, poměr zhruba 3 : 2 : 1.3. */
const HEIGHT: Record<PodiumRank, number> = { 1: 9, 2: 6, 3: 4 };
/** Klasické pódium zleva: druhý, první, třetí. */
const ORDER: readonly PodiumRank[] = [2, 1, 3];

/** Sloupce pódia jen pro existující hráče (0–3), v pořadí zleva. */
export function podiumColumns(count: number): PodiumColumn[] {
  return ORDER.filter((rank) => rank <= count).map((rank, order) => ({ rank, order, dots: HEIGHT[rank] }));
}
