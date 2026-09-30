import type { ThemePreference } from '@/store/settings';
import type { SeasonThemeId } from '@/types';
import { dark, light, type Colors } from './palettes';
import { neutralSeasonal, SEASON_OVERRIDES, type SeasonalColors } from './seasons';
import { font, material, radius, size, space, type Fonts, type Material, type Radius, type Size, type Space } from './tokens';

export type Scheme = 'light' | 'dark';

export interface Theme {
  scheme: Scheme; c: Colors; space: Space; radius: Radius; size: Size; material: Material; font: Fonts; seasonal: SeasonalColors;
  /** Aktivní sezónní téma (spec §6.3), null mimo sezónu. Čte ho např. sezónní šála opice. */
  seasonThemeId: SeasonThemeId | null;
}

/** Volba uživatele má přednost; 'system' přebírá schéma OS. Neznámé schéma
 *  (null / 'unspecified', např. web bez preference) padá na tmavé — výchozí vzhled appky. */
export function resolveScheme(pref: ThemePreference, system: string | null | undefined): Scheme {
  if (pref !== 'system') return pref;
  return system === 'light' ? 'light' : 'dark';
}

export function buildTheme(scheme: Scheme, seasonThemeId: SeasonThemeId | null): Theme {
  const c = scheme === 'dark' ? dark : light;
  return {
    scheme, c, space, radius, size, material, font,
    seasonThemeId,
    seasonal: seasonThemeId ? SEASON_OVERRIDES[seasonThemeId][scheme] : neutralSeasonal(c),
  };
}
