import type { MascotStage } from '@/types';

export type AnchorName = 'head' | 'neck' | 'body' | 'handL' | 'handR';
export interface Anchor { x: number; y: number; scale: number }

// Kotvy kosmetických vrstev ve viewBoxu 200×200 (spec §8). Souřadnice odpovídají geometrii
// stage 1 v SvgMascot: střed hlavy, přechod hlavy do těla, střed trupu a středy dlaní
// na koncích paží pootočených o ±18° od ramen (74,128) a (126,128).
const STAGE_1: Record<AnchorName, Anchor> = {
  head: { x: 100, y: 80, scale: 1 },
  neck: { x: 100, y: 126, scale: 1 },
  body: { x: 100, y: 148, scale: 1 },
  handL: { x: 64, y: 159, scale: 1 },
  handR: { x: 136, y: 159, scale: 1 },
};

export const ANCHORS: Record<MascotStage, Record<AnchorName, Anchor>> = {
  1: STAGE_1,
  // plán B: stage 2 a 3 dostanou vlastní geometrii i kotvy, do té doby sdílí stage 1.
  2: STAGE_1,
  3: STAGE_1,
};
