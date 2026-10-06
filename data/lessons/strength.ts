import type { Lesson } from '@/types';

const L = (order: number, title: string, plateKg: Lesson['plateKg'], exerciseIds: string[], isBoss = false): Lesson =>
  ({ id: `st-1-${isBoss ? 'boss' : order}`, pathId: 'strength', section: 1, order, title, plateKg, exerciseIds, isBoss });

export const STRENGTH_LESSONS: Lesson[] = [
  L(1, 'Foundation', 5, ['squat', 'incline-pushup', 'plank']),
  L(2, 'Legs', 5, ['squat', 'lunge', 'glute-bridge']),
  L(3, 'Push', 10, ['pushup', 'bench-dip', 'plank']),
  L(4, 'Stability', 10, ['lunge', 'side-plank', 'glute-bridge', 'squat']),
  L(5, 'Volume', 15, ['pushup', 'squat', 'bench-dip', 'hollow-hold']),
  L(6, 'Single side', 15, ['lunge', 'glute-bridge', 'pushup', 'side-plank']),
  L(7, 'Density', 20, ['squat', 'pushup', 'lunge', 'bench-dip']),
  L(8, 'Hold under pressure', 20, ['pushup', 'jump-squat', 'bench-dip', 'plank']),
  L(9, 'Boss: Full bar', 25, ['pushup', 'squat', 'bench-dip', 'lunge', 'plank'], true),
];
