import { LEAGUE_TIERS } from '@/data/leagues';
import type { LeagueTierId } from '@/types';

/** Název ligové úrovně; neznámá nebo chybějící úroveň spadne na první (nejnižší), aby mapa nezůstala prázdná. */
export function tierName(tierId: LeagueTierId | undefined): string {
  return (LEAGUE_TIERS.find((t) => t.id === tierId) ?? LEAGUE_TIERS[0]!).name;
}

/** Název ligové úrovně pro TopBar. Plán B ho nahradí `useLeague()`. Hooky smí číst data/, UI ne. */
export function useTierName(tierId: LeagueTierId | undefined): string {
  return tierName(tierId);
}
