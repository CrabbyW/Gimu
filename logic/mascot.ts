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

/** Parametr routy stage-up → stage, nebo null (neplatný vstup = rovnou na mapu). */
export function parseStageParam(s: string | string[] | undefined): MascotStage | null {
  const raw = Array.isArray(s) ? s[0] : s;
  if (raw === undefined || !/^[1-3]$/.test(raw)) return null;
  return Number(raw) as MascotStage;
}
