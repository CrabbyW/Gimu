import type { OnboardingInput, UserProfile, WeightEntry, WeightGoal } from '@/types';
import { addDays, weekStart } from './dates';
import { mulberry32 } from './random';

export function parseWeight(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d{2,3}(\.\d)?$/.test(s)) return null;
  return Number(s);
}

const inRange = (kg: number | null): kg is number => kg !== null && kg >= 30 && kg <= 250;

export function validateWeightGoal(
  kind: 'lose' | 'gain',
  current: number | null,
  target: number | null,
): 'ok' | 'invalid' | 'loseDirection' | 'gainDirection' {
  if (!inRange(current) || !inRange(target)) return 'invalid';
  if (kind === 'lose' && target >= current) return 'loseDirection';
  if (kind === 'gain' && target <= current) return 'gainDirection';
  return 'ok';
}

export function mockWeightHistory(goal: WeightGoal, now: Date, seed: number): WeightEntry[] {
  if (goal.kind === 'none') return [];
  const rnd = mulberry32(seed);
  const dir = goal.kind === 'lose' ? -1 : 1;
  const thisWeek = weekStart(now);
  return Array.from({ length: 8 }, (_, i) => {
    const weeksAgo = 7 - i;
    const trend = -dir * weeksAgo * 0.35; // o 0.35 kg týdně "před" aktuální vahou
    const noise = weeksAgo === 0 ? 0 : (rnd() - 0.5) * 0.6;
    return { weekStart: addDays(thisWeek, -7 * weeksAgo), kg: Math.round((goal.startKg + trend + noise) * 10) / 10 };
  });
}

export function buildInitialProfile(input: OnboardingInput, now: Date): UserProfile {
  return {
    path: input.path, dreamBody: input.dreamBody.trim(), milestones: input.milestones,
    weightGoal: input.weightGoal, weights: mockWeightHistory(input.weightGoal, now, now.getTime() % 100_000),
    activity: [], equipped: {}, owned: [], seasonGoals: {}, leagueTier: 'wood', createdAt: now.toISOString(),
  };
}
