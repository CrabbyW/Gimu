import type { BadgeDef } from '@/logic/badges';

/** Katalog odznaků za trénink (sezónní odznaky žijí v `seasons.ts`). Pořadí = pořadí na Profilu. */
export const BADGES: BadgeDef[] = [
  { id: 'badge-first-lesson', name: 'První lekce', rule: { kind: 'lessons', n: 1 } },
  { id: 'badge-streak-3', name: '3 dny v řadě', rule: { kind: 'streak', n: 3 } },
  { id: 'badge-lessons-5', name: '5 lekcí', rule: { kind: 'lessons', n: 5 } },
  { id: 'badge-streak-7', name: '7 dní v řadě', rule: { kind: 'streak', n: 7 } },
  { id: 'badge-first-boss', name: 'První boss', rule: { kind: 'boss', n: 1 } },
  { id: 'badge-wall-handstand', name: 'Stojka u zdi', rule: { kind: 'exercise', exerciseId: 'wall-handstand' } },
  { id: 'badge-crow', name: 'Vrána', rule: { kind: 'exercise', exerciseId: 'crow-hold' } },
  { id: 'badge-lsit', name: 'L-sit', rule: { kind: 'exercise', exerciseId: 'tuck-lsit' } },
  { id: 'badge-lessons-25', name: '25 lekcí', rule: { kind: 'lessons', n: 25 } },
  { id: 'badge-xp-1000', name: '1 000 XP', rule: { kind: 'xp', n: 1000 } },
  { id: 'badge-streak-30', name: '30 dní v řadě', rule: { kind: 'streak', n: 30 } },
  { id: 'badge-lessons-50', name: '50 lekcí', rule: { kind: 'lessons', n: 50 } },
];
