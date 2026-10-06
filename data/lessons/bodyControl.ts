import type { Lesson } from '@/types';

const L = (order: number, title: string, plateKg: Lesson['plateKg'], exerciseIds: string[], isBoss = false): Lesson =>
  ({ id: `bc-1-${isBoss ? 'boss' : order}`, pathId: 'bodyControl', section: 1, order, title, plateKg, exerciseIds, isBoss });

export const BODY_CONTROL_LESSONS: Lesson[] = [
  L(1, 'Solid core', 5, ['plank', 'hollow-hold', 'glute-bridge']),
  L(2, 'Body line', 5, ['plank', 'superman', 'side-plank']),
  L(3, 'Palm support', 10, ['incline-pushup', 'plank', 'pike-hold']),
  L(4, 'Hollow', 10, ['hollow-hold', 'hollow-rock', 'superman', 'side-plank']),
  L(5, 'Overhead', 15, ['pike-hold', 'pushup', 'hollow-hold', 'plank']),
  L(6, 'Shoulders down', 15, ['tuck-lsit', 'bench-dip', 'hollow-rock', 'side-plank']),
  L(7, 'Upside down', 20, ['wall-handstand', 'pike-hold', 'hollow-hold', 'tuck-lsit']),
  L(8, 'Balance', 20, ['crow-hold', 'wall-handstand', 'hollow-rock', 'plank']),
  L(9, 'Boss: Full bar', 25, ['wall-handstand', 'crow-hold', 'tuck-lsit', 'hollow-rock', 'plank'], true),
];
