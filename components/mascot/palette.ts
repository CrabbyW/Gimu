import type { Colors } from '@/theme';

// Barvy opice jsou v obou režimech stejné (spec §8: srst, obličej a uši, detail).
// Detail (oči, nos, pusa) bere barvu z tématu, viz `mascotInk`.
export const MASCOT_COLORS = { fur: '#7A5236', furShade: '#5E3F29', face: '#E8C7A0' } as const;

/** Barva detailu (oči, nos, pusa). Detaily leží na světlém `face`, který je v obou režimech
 *  stejný, takže `c.text` by v dark režimu (#EFEDE8) na obličeji zmizel. Bere se proto tmavý
 *  inkoust tématu `onAccent` (#131316 v obou režimech): stejná role, obsah na světlé výplni. */
export const mascotInk = (c: Colors): string => c.onAccent;
