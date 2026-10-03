import { mascot, type Colors } from '@/theme';

// Barvy opice jsou v obou režimech stejné (spec §8: srst, obličej a uši, detail), token `mascot` v theme/tokens.ts.
// Detail (oči, nos, pusa) má vlastní inkoust `mascot.ink`, viz `mascotInk`.
export const MASCOT_COLORS = mascot;

/** Barva detailu (oči, nos, pusa). Detaily leží na světlém `face`, který je v obou režimech
 *  stejný, takže `c.text` by v dark režimu na obličeji zmizel. Teplá litina má `onAccent` v každém
 *  režimu jiný, proto opice nese vlastní tmavý inkoust (materiál opice, ne UI). `c` zůstává kvůli API. */
export const mascotInk = (_c: Colors): string => mascot.ink;
