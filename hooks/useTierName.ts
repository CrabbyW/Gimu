import { LEAGUE_TIERS } from '@/data/leagues';
import type { LeagueTierId } from '@/types';

/** Název ligové úrovně pro TopBar. Plán B ho nahradí `useLeague()`. Hooky smí číst data/, UI ne. */
export function useTierName(tierId: LeagueTierId | undefined): string | null {
  if (!tierId) return null;
  return LEAGUE_TIERS.find((t) => t.id === tierId)?.name ?? null;
}
