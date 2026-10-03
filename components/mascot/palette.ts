import { mascot, type Colors } from '@/theme';

// Barvy opice jsou v obou režimech stejné (spec §8: srst, obličej a uši, detail), token `mascot` v theme/tokens.ts.
// Detail (oči, nos, pusa) bere barvu z tématu, viz `mascotInk`.
export const MASCOT_COLORS = mascot;

/** Barva detailu (oči, nos, pusa). Detaily leží na světlém `face`, který je v obou režimech
 *  stejný, takže `c.text` by v dark režimu (#F0EEE9) na obličeji zmizel. Bere se proto tmavý
 *  inkoust tématu `onAccent` (#181613 v obou režimech): stejná role, obsah na světlé výplni. */
export const mascotInk = (c: Colors): string => c.onAccent;
