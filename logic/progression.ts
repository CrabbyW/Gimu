// UX pass U2: pocit po lekci → osobní korekce dávek. Čisté funkce, bez úložiště.
// Korekce se násobí s násobkem vstupního testu (`logic/fitnessTest.ts`).
import type { Feel, Progression } from '@/types';
import type { Scale } from './fitnessTest';

export const PROGRESSION = {
  /** Krok korekce za jedno hodnocení. */
  step: 0.1,
  min: 0.7,
  max: 1.3,
} as const;

export const EMPTY_PROGRESSION: Progression = { factor: 1, rated: [] };

const clamp = (v: number) => Math.min(PROGRESSION.max, Math.max(PROGRESSION.min, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Hodnocení pokusu. Easy = +krok, Hard = −krok, Right = beze změny. Stejný pokus podruhé = beze změny (idempotentní). */
export function applyFeel(p: Progression | undefined, attemptId: string, feel: Feel): Progression {
  const cur = p ?? EMPTY_PROGRESSION;
  if (cur.rated.includes(attemptId)) return cur;
  const delta = feel === 'easy' ? PROGRESSION.step : feel === 'hard' ? -PROGRESSION.step : 0;
  // Drží jen posledních 50 id: idempotence stačí pro nedávné pokusy, profil neroste donekonečna.
  return { factor: round2(clamp(cur.factor + delta)), rated: [...cur.rated, attemptId].slice(-50) };
}

/** Výsledný násobek dávek: vstupní test × osobní korekce (s mezemi testu se nepočítá znovu, korekce má vlastní). */
export function combineScale(test: Scale, p: Progression | undefined): Scale {
  const f = p?.factor ?? 1;
  return { reps: round2(test.reps * f), hold: round2(test.hold * f) };
}
