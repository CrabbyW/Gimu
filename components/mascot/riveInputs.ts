import type { CosmeticSlot } from '@/types';
import type { MascotProps } from './types';

const SLOTS: CosmeticSlot[] = ['outfit', 'accessory', 'mapBackground', 'lessonEffect', 'profileFrame'];

/** Vstupy Rive state machine (spec §8): stage a variantIndex každého slotu jako number, nálada jako trigger. */
export function riveInputs(
  p: Pick<MascotProps, 'stage' | 'mood' | 'cosmetics'>,
  variantOf: (id: string) => number,
): { numbers: Record<string, number>; trigger: 'happy' | 'celebrate' | 'sad' | null } {
  const numbers: Record<string, number> = { stage: p.stage };
  for (const s of SLOTS) {
    const id = p.cosmetics[s];
    numbers[s] = id ? variantOf(id) : 0;
  }
  return { numbers, trigger: p.mood === 'idle' ? null : p.mood };
}
