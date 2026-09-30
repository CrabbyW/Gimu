import type { PathId } from '@/types';

/** Glyf karty vize: plochá geometrie ze skládaných kruhů, stejný jazyk jako glyfy cest (spec §7.1). */
export type DreamGlyphId =
  | 'wedge' | 'balance' | 'plate' | 'rise' | 'taper' | 'stack' | 'ring' | 'trio'
  | 'inverted' | 'orbit' | 'core' | 'pair' | 'half' | 'custom';

/** Karta vize těla. Titulek a řádek jsou v `copy.onboarding.dream.options[id]`. */
export interface DreamOption { id: DreamOptionId; glyph: DreamGlyphId }

export type DreamOptionId =
  | 'muscleUp' | 'vTaper' | 'explosive' | 'pullStrength' | 'lean' | 'athlete'
  | 'handstand' | 'lightStrong' | 'core' | 'mobility' | 'planche' | 'gymnast'
  | 'rawStrength' | 'mass' | 'legs' | 'shoulders' | 'grip' | 'durable';

/** Šest vizí na cestu (rozhodnutí R36). „Vlastní…“ není v datech, je to režim obrazovky. */
export const DREAM_OPTIONS: Record<PathId, readonly DreamOption[]> = {
  power: [
    { id: 'muscleUp', glyph: 'rise' },
    { id: 'vTaper', glyph: 'taper' },
    { id: 'explosive', glyph: 'wedge' },
    { id: 'pullStrength', glyph: 'stack' },
    { id: 'lean', glyph: 'ring' },
    { id: 'athlete', glyph: 'trio' },
  ],
  bodyControl: [
    { id: 'handstand', glyph: 'inverted' },
    { id: 'lightStrong', glyph: 'balance' },
    { id: 'core', glyph: 'core' },
    { id: 'mobility', glyph: 'orbit' },
    { id: 'planche', glyph: 'pair' },
    { id: 'gymnast', glyph: 'trio' },
  ],
  strength: [
    { id: 'rawStrength', glyph: 'plate' },
    { id: 'mass', glyph: 'core' },
    { id: 'legs', glyph: 'half' },
    { id: 'shoulders', glyph: 'pair' },
    { id: 'grip', glyph: 'ring' },
    { id: 'durable', glyph: 'stack' },
  ],
};
