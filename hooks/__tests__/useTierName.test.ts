import { LEAGUE_TIERS } from '@/data/leagues';
import type { LeagueTierId } from '@/types';
import { tierName } from '../useTierName';

test('známá úroveň vrací svůj název', () => {
  expect(tierName('gold')).toBe('Gold');
});

test('neznámá nebo chybějící úroveň spadne na první úroveň', () => {
  expect(tierName('mythril' as LeagueTierId)).toBe(LEAGUE_TIERS[0]!.name);
  expect(tierName(undefined)).toBe(LEAGUE_TIERS[0]!.name);
});
