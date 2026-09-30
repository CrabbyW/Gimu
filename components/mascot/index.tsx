// Jediný vstupní bod pro maskota. Celá appka importuje odsud.
// Fáze 3: přepnout na `export { RiveMascot as Mascot } from './RiveMascot'` (stub v RiveMascot.tsx, vstupy v riveInputs.ts).
export { SvgMascot as Mascot } from './SvgMascot';
export type { MascotProps } from './types';
export { MASCOT_SIZES } from './types';
