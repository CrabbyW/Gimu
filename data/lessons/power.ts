import type { Lesson } from '@/types';

const L = (order: number, title: string, plateKg: Lesson['plateKg'], exerciseIds: string[], isBoss = false): Lesson =>
  ({ id: `pw-1-${isBoss ? 'boss' : order}`, pathId: 'power', section: 1, order, title, plateKg, exerciseIds, isBoss });

export const POWER_LESSONS: Lesson[] = [
  L(1, 'Grip', 5, ['dead-hang', 'scap-pull', 'hollow-hold']),
  L(2, 'Shoulder blades', 5, ['scap-pull', 'incline-pushup', 'plank']),
  L(3, 'Takeoff', 10, ['jump-squat', 'dead-hang', 'bench-dip']),
  L(4, 'Pull down', 10, ['negative-pullup', 'scap-pull', 'hollow-rock']),
  L(5, 'Burst', 15, ['burpee', 'negative-pullup', 'bench-dip']),
  L(6, 'Push and pull', 15, ['pushup', 'negative-pullup', 'dead-hang', 'hollow-hold']),
  L(7, 'Tempo', 20, ['burpee', 'jump-squat', 'negative-pullup', 'bench-dip']),
  L(8, 'Control', 20, ['negative-pullup', 'pushup', 'dead-hang', 'hollow-rock']),
  L(9, 'Boss: Full bar', 25, ['negative-pullup', 'burpee', 'bench-dip', 'dead-hang', 'hollow-rock'], true),
];
