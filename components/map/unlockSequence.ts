// Čistá logika odemykací sekvence mapy (spec §7.2), pokrytá testem v logic/__tests__/unlockSequence.test.ts.
import type { NodeState } from '@/logic/map';

/** 0 = výchozí snímek (nový uzel ještě zamčený, předchozí bez fajfky), 1–4 časované,
 *  5 = po dopadu odemčení (opice skáče), 6 = hotovo. */
export type UnlockPhase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Fáze spouštěné časem od startu sekvence: scroll, fajfka, dokreslení čáry, odemčení. */
export const UNLOCK_STEPS: { phase: UnlockPhase; at: number }[] = [
  { phase: 1, at: 0 }, { phase: 2, at: 350 }, { phase: 3, at: 700 }, { phase: 4, at: 1100 },
];
/** Jak dlouho má opice po doskoku radost, než se sekvence uzavře. */
export const HAPPY_MS = 900;

export interface UnlockFrame {
  prevCheck: 'hidden' | 'draw' | 'static';
  segment: 'pending' | 'draw' | 'drawn';
  next: 'locked' | 'unlocking' | 'current';
  mascotOn: 'prev' | 'next';
}

/** Předchozí (právě dokončený) a nově odemčený uzel. Zastaralý nebo cizí parametr vrací null. */
export function findUnlockPair(nodes: { id: string; state: NodeState }[], unlockedId: string | null | undefined) {
  if (!unlockedId) return null;
  const i = nodes.findIndex((n) => n.id === unlockedId);
  const prev = nodes[i - 1];
  if (i < 1 || !prev || nodes[i]!.state !== 'current' || prev.state !== 'done') return null;
  return { prevId: prev.id, nextId: unlockedId };
}

/** Jak vykreslit pár uzlů v dané fázi. `null` = žádná sekvence, konečný stav. */
export function unlockFrame(phase: UnlockPhase | null): UnlockFrame {
  const p = phase ?? 6;
  return {
    prevCheck: p === 6 ? 'static' : p >= 2 ? 'draw' : 'hidden',
    segment: p === 6 ? 'drawn' : p >= 3 ? 'draw' : 'pending',
    next: p >= 5 ? 'current' : p === 4 ? 'unlocking' : 'locked',
    mascotOn: p >= 5 ? 'next' : 'prev',
  };
}
