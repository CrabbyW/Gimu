// Jediný vstupní bod pro maskota. Celá appka importuje odsud.
// Fáze 3: přepnout na `export { RiveMascot as Mascot } from './RiveMascot'` (stub v RiveMascot.tsx, vstupy v riveInputs.ts).
export { SvgMascot as Mascot, MonkeyBack, MonkeyFront } from './SvgMascot';
export { seatY as mascotSeatY } from './geometry';
export type { MascotProps } from './types';
export { MASCOT_SIZES } from './types';
export { ReactiveMascot } from './ReactiveMascot';
export { useMascotReactions, useScreenFocused, type MascotReactions } from './useMascotReactions';
export type { MascotReaction, MascotGaze } from './types';
