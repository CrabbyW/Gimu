import type { MascotStage } from '@/types';

export function stageForXp(xp: number, t: readonly number[]): MascotStage {
  const s = t.filter((min) => xp >= min).length;
  return Math.min(Math.max(s, 1), 3) as MascotStage;
}

export function stageProgress(xp: number, t: readonly number[]): { stage: MascotStage; into: number; span: number | null } {
  const stage = stageForXp(xp, t);
  const from = t[stage - 1] ?? 0; const to = t[stage];
  return { stage, into: xp - from, span: to === undefined ? null : to - from };
}
