import type { MascotStage } from '@/types';

export type AnchorName = 'head' | 'neck' | 'body' | 'handL' | 'handR';
export interface Anchor { x: number; y: number; scale: number }

// Kotvy kosmetických vrstev ve viewBoxu 200×200 (spec §8), odvozené z `geometry.ts`:
// střed hlavy, přechod hlavy do těla, střed trupu a konce paží v klidové póze.
// Kosmetika na rukou se kreslí uvnitř otáčené skupiny paže (Task 17).
const STAGE_1: Record<AnchorName, Anchor> = {
  head: { x: 100, y: 80, scale: 1 },
  neck: { x: 100, y: 126, scale: 1 },
  body: { x: 100, y: 148, scale: 1 },
  // Konec paže: rameno (74,128) / (126,128), délka 40, ±18°.
  handL: { x: 62, y: 166, scale: 1 },
  handR: { x: 138, y: 166, scale: 1 },
};
const STAGE_2: Record<AnchorName, Anchor> = {
  head: { x: 100, y: 72, scale: 0.815 }, neck: { x: 100, y: 108, scale: 1.1 }, body: { x: 100, y: 140, scale: 1.21 },
  handL: { x: 58, y: 162, scale: 1.14 }, handR: { x: 142, y: 162, scale: 1.14 },
};
const STAGE_3: Record<AnchorName, Anchor> = {
  head: { x: 100, y: 64, scale: 0.74 }, neck: { x: 100, y: 98, scale: 1.3 }, body: { x: 100, y: 138, scale: 1.25 },
  handL: { x: 44, y: 167, scale: 1.57 }, handR: { x: 156, y: 167, scale: 1.57 },
};

export const ANCHORS: Record<MascotStage, Record<AnchorName, Anchor>> = { 1: STAGE_1, 2: STAGE_2, 3: STAGE_3 };
