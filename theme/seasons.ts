import type { SeasonThemeId } from '@/types';
import type { Colors } from './palettes';

/** Sezóna přepisuje jen neutrály hlavičky a mapy (spec §6.3). Akcent se nemění. */
export interface SeasonalColors { headerBase: string; mapBase: string; mapRule: string; mapTexture: string | null }
export const neutralSeasonal = (c: Colors): SeasonalColors => ({ headerBase: c.base, mapBase: c.base, mapRule: c.rule, mapTexture: null });
export const SEASON_OVERRIDES: Record<SeasonThemeId, { dark: SeasonalColors; light: SeasonalColors }> = {
  winterArc: {
    dark: { headerBase: '#0F1418', mapBase: '#0C1115', mapRule: '#243039', mapTexture: 'rgba(170,205,230,0.07)' },
    light: { headerBase: '#E6ECEF', mapBase: '#E9EEF1', mapRule: '#BCC8CF', mapTexture: 'rgba(40,80,110,0.08)' },
  },
  summerBody: {
    dark: { headerBase: '#15110C', mapBase: '#120F0B', mapRule: '#322A20', mapTexture: null },
    light: { headerBase: '#F2EEE6', mapBase: '#F3EFE7', mapRule: '#D2C8B8', mapTexture: null },
  },
};

/** Materiál sezónních kosmetických vrstev (šála Winter Arc). Na rozdíl od neutrálů mapy musí
 *  vystoupit z podkladu i ze srsti opice: světlejší ocelová modrošedá, pruhy v tmavém tónu sezóny. */
export interface SeasonMaterial { fabric: string; stripe: string }
export const SEASON_MATERIAL: Record<'winterArc', { dark: SeasonMaterial; light: SeasonMaterial }> = {
  winterArc: {
    dark: { fabric: '#6F8797', stripe: '#243039' },
    light: { fabric: '#5B7485', stripe: '#BCC8CF' },
  },
};
