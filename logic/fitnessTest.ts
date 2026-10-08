// Vstupní test a bezpečnost (elite fáze 5, spec docs/superpowers/specs/2026-10-08-elite-faze5-vstupni-test-design.md).
// Dávka = zhruba polovina maxima z testu (submaximálně, ~RPE 7, „pár opakování v záloze“),
// vztažená k výchozí dávce cviku. Čisté funkce, bez Reactu a úložiště.
import type { Exercise, FitnessTest } from '@/types';

export const FITNESS = {
  /** Podíl maxima, který se cvičí v lekci (submaximální dávka). */
  workRatio: 0.5,
  /** Referenční cvik a jeho výchozí dávka: výchozí lekce odpovídá testu 2 × tato dávka. */
  refReps: 8, // klik (`data/exercises.ts` pushup.amount)
  refHoldS: 30, // plank (`data/exercises.ts` plank.amount)
  /** Meze násobku: nikdy méně než polovina, nikdy víc než 1.5× výchozí dávky. */
  minScale: 0.5,
  maxScale: 1.5,
  /** Nejmenší dávka po škálování. */
  minAmount: { reps: 3, hold: 5 },
  /** Vstupy testu: nesmyslné hodnoty se oříznou. */
  maxPushups: 100,
  maxPlankS: 600,
} as const;

export interface Scale { reps: number; hold: number }
export const NEUTRAL_SCALE: Scale = { reps: 1, hold: 1 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/** Očištění vstupu testu (prázdné/záporné/NaN = 0, strop). */
export function sanitizeTest(t: { pushups: number; plankS: number; kneePushups?: boolean }): Pick<FitnessTest, 'pushups' | 'plankS' | 'kneePushups'> {
  const n = (v: number, max: number) => (Number.isFinite(v) ? clamp(Math.floor(v), 0, max) : 0);
  return { pushups: n(t.pushups, FITNESS.maxPushups), plankS: n(t.plankS, FITNESS.maxPlankS), kneePushups: Boolean(t.kneePushups) };
}

/** Násobek dávek z testu. Kliky na kolenou se počítají za polovinu (lehčí varianta). Bez testu = 1. */
export function scaleFromTest(t: FitnessTest | undefined | null): Scale {
  if (!t) return NEUTRAL_SCALE;
  const s = sanitizeTest(t);
  const strictPushups = s.kneePushups ? s.pushups / 2 : s.pushups;
  const reps = clamp((strictPushups * FITNESS.workRatio) / FITNESS.refReps, FITNESS.minScale, FITNESS.maxScale);
  const hold = clamp((s.plankS * FITNESS.workRatio) / FITNESS.refHoldS, FITNESS.minScale, FITNESS.maxScale);
  return { reps: round2(reps), hold: round2(hold) };
}

/** Dávka cviku po škálování: výdrž na celých 5 s, opakování na celá čísla, se spodní mezí. */
export function scaledAmount(e: Pick<Exercise, 'type' | 'amount'>, scale: Scale): number {
  if (e.type === 'hold') {
    const v = Math.round((e.amount * scale.hold) / 5) * 5;
    return Math.max(FITNESS.minAmount.hold, v);
  }
  return Math.max(FITNESS.minAmount.reps, Math.round(e.amount * scale.reps));
}

/** Zjednodušená kontrola připravenosti (podle 7 obecných otázek PAR-Q+ 2024). Jakékoli „ano“ = doporučit lékaře. */
export const READINESS_QUESTIONS = 7;
export function readiness(answers: readonly boolean[]): 'clear' | 'consult' {
  return answers.some(Boolean) ? 'consult' : 'clear';
}
