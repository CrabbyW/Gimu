import type { Lesson } from '@/types';

const L = (order: number, title: string, plateKg: Lesson['plateKg'], exerciseIds: string[], isBoss = false): Lesson =>
  ({ id: `bc-1-${isBoss ? 'boss' : order}`, pathId: 'bodyControl', section: 1, order, title, plateKg, exerciseIds, isBoss });

export const BODY_CONTROL_LESSONS: Lesson[] = [
  L(1, 'Pevný střed', 5, ['plank', 'hollow-hold', 'glute-bridge']),
  L(2, 'Linie těla', 5, ['plank', 'superman', 'side-plank']),
  L(3, 'Opora v\u00A0dlaních', 10, ['incline-pushup', 'plank', 'pike-hold']),
  L(4, 'Hollow', 10, ['hollow-hold', 'hollow-rock', 'superman', 'side-plank']),
  L(5, 'Nad hlavou', 15, ['pike-hold', 'pushup', 'hollow-hold', 'plank']),
  L(6, 'Stlač ramena', 15, ['tuck-lsit', 'bench-dip', 'hollow-rock', 'side-plank']),
  L(7, 'Vzhůru nohama', 20, ['wall-handstand', 'pike-hold', 'hollow-hold', 'tuck-lsit']),
  L(8, 'Balanc', 20, ['crow-hold', 'wall-handstand', 'hollow-rock', 'plank']),
  L(9, 'Boss: Plná osa', 25, ['wall-handstand', 'crow-hold', 'tuck-lsit', 'hollow-rock', 'plank'], true),
];
