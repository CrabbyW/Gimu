import type { ThemePreference } from '@/store/settings';
import type { SeasonThemeId } from '@/types';
import { dark, light, type Colors } from './palettes';
import { neutralSeasonal, SEASON_OVERRIDES, type SeasonalColors } from './seasons';
import { font, radius, space, type Fonts, type Radius, type Space } from './tokens';

export type Scheme = 'light' | 'dark';

export interface Theme { scheme: Scheme; c: Colors; space: Space; radius: Radius; font: Fonts; seasonal: SeasonalColors }

/** Volba uživatele má přednost; 'system' přebírá schéma OS. Neznámé schéma
 *  (null / 'unspecified', např. web bez preference) padá na tmavé — výchozí vzhled appky. */
export function resolveScheme(pref: ThemePreference, system: string | null | undefined): Scheme {
  if (pref !== 'system') return pref;
  return system === 'light' ? 'light' : 'dark';
}

export function buildTheme(scheme: Scheme, seasonThemeId: SeasonThemeId | null): Theme {
  const c = scheme === 'dark' ? dark : light;
  return {
    scheme, c, space, radius, font,
    seasonal: seasonThemeId ? SEASON_OVERRIDES[seasonThemeId][scheme] : neutralSeasonal(c),
  };
}
