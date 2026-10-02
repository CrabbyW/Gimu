// Tab Progres (spec §7.6): graf váhy, mřížka aktivity, milníky.
import type { ActivityEvent, ISODate, Milestone, WeightEntry, WeightGoal } from '@/types';
import { addDays, parseISODate, weekStart } from './dates';
import { activeDays } from './streak';

export interface WeightChartModel { points: WeightEntry[]; targetKg: number; startKg: number; yMin: number; yMax: number; yTicks: number[] }
export type GridCell = { day: ISODate; state: 'active' | 'empty' | 'today' | 'future' };

const half = (n: number) => Math.round(n * 2) / 2;

/** `null` = graf se neukáže (cíl váhy „neřeším“). */
export function weightChartModel(goal: WeightGoal, weights: WeightEntry[], maxPoints = 8): WeightChartModel | null {
  if (goal.kind === 'none') return null;
  const points = [...weights].sort((a, b) => a.weekStart.localeCompare(b.weekStart)).slice(-maxPoints);
  const all = [...points.map((p) => p.kg), goal.targetKg, goal.startKg];
  const yMin = Math.floor(Math.min(...all)) - 1;
  const yMax = Math.ceil(Math.max(...all)) + 1;
  const yTicks = [0, 1, 2, 3].map((i) => (i === 0 ? yMin : i === 3 ? yMax : half(yMin + (i * (yMax - yMin)) / 3)));
  return { points, targetKg: goal.targetKg, startKg: goal.startKg, yMin, yMax, yTicks };
}

/** `weeks` týdnů po–ne, poslední končí nedělí týdne s `today`. dev-xp se nepočítá. */
export function activityGrid(events: ActivityEvent[], today: ISODate, weeks = 5): GridCell[] {
  const start = addDays(weekStart(parseISODate(today)), -7 * (weeks - 1));
  const active = new Set(activeDays(events));
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const day = addDays(start, i);
    const state: GridCell['state'] = day === today ? 'today' : day > today ? 'future' : active.has(day) ? 'active' : 'empty';
    return { day, state };
  });
}

export const isMilestoneDone = (m: Milestone): boolean => m.current >= m.target;

export function newlyCompleted(before: Milestone[], after: Milestone[]): string[] {
  const was = new Map(before.map((m) => [m.id, isMilestoneDone(m)]));
  return after.filter((m) => isMilestoneDone(m) && was.get(m.id) === false).map((m) => m.id);
}
