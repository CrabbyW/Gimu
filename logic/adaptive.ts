import type { Exercise, TrainingDebt, Volume } from '@/types';

/** Dluh tréninku z přeskočených cviků: sekundy výdrže a opakování. Rozkládá se do dalších lekcí,
 *  aby se dlouhodobý objem (a cíl) plnil, ale nikdy ne skokem: platí strop dluhu i strop navýšení na cvik. */
export type { TrainingDebt, Volume };
// `share` = navýšení na lekci, zafixované při přeskočení (dluh / spread), aby šel rovnoměrně: 50 s → 5 × 10 s.
type Kind = keyof Volume;

export const EMPTY_DEBT: TrainingDebt = { holdS: 0, reps: 0, share: { holdS: 0, reps: 0 } };

export const ADAPT = {
  /** Na kolik dalších lekcí se dluh rozloží (podíl = dluh / spread, nahoru). */
  spreadLessons: 5,
  /** Strop dluhu: co je nad, propadne (nikdo nemá dohánět týden skipů). */
  maxDebt: { holdS: 150, reps: 40 } satisfies Volume,
  /** Strop navýšení jednoho cviku v lekci: absolutně a poměrem k základnímu objemu. */
  perExerciseCap: { holdS: 15, reps: 4 } satisfies Volume,
  perExerciseRatio: 0.25,
  /** Nejmenší podíl na lekci, aby dluh skutečně doběhl a nezůstal viset v drobných. */
  minShare: { holdS: 5, reps: 1 } satisfies Volume,
  /** Lekce se započítá (série, odemčení), když je odcvičená aspoň tato část cviků. */
  minDoneRatio: 0.5,
} as const;

const kindOf = (e: Pick<Exercise, 'type'>): Kind => (e.type === 'hold' ? 'holdS' : 'reps');
const clamp = (v: number, max: number) => Math.min(Math.max(0, v), max);

const shareOf = (k: Kind, v: number) => (v <= 0 ? 0 : Math.max(ADAPT.minShare[k], Math.ceil(v / ADAPT.spreadLessons)));

/** Přidá objem přeskočených cviků do dluhu (se stropem) a přepočítá podíl na lekci. */
export function addSkipped(debt: TrainingDebt, skipped: readonly Pick<Exercise, 'type' | 'amount'>[]): TrainingDebt {
  if (skipped.length === 0) return debt;
  const next: TrainingDebt = { holdS: debt.holdS, reps: debt.reps, share: { ...debt.share } };
  for (const e of skipped) { const k = kindOf(e); next[k] = clamp(next[k] + e.amount, ADAPT.maxDebt[k]); }
  for (const k of ['holdS', 'reps'] as const) next.share[k] = shareOf(k, next[k]);
  return next;
}

/** Navýšení každého cviku lekce z dluhu (stejné pořadí jako `exercises`). Deterministické: stejný dluh = stejná lekce. */
export function lessonExtras(exercises: readonly Pick<Exercise, 'type' | 'amount'>[], debt: TrainingDebt): number[] {
  const left: Volume = { holdS: 0, reps: 0 };
  for (const k of ['holdS', 'reps'] as const) left[k] = Math.min(debt[k], debt.share[k] || shareOf(k, debt[k]));
  return exercises.map((e) => {
    const k = kindOf(e);
    const cap = Math.min(ADAPT.perExerciseCap[k], Math.max(1, Math.floor(e.amount * ADAPT.perExerciseRatio)));
    const extra = Math.min(left[k], cap);
    left[k] -= extra;
    return extra;
  });
}

/** Dluh po lekci: odcvičené navýšení se odečte, přeskočené cviky přidají svůj základní objem. */
export function settleDebt(
  debt: TrainingDebt, exercises: readonly Pick<Exercise, 'type' | 'amount'>[], extras: readonly number[], done: readonly boolean[],
): TrainingDebt {
  const paid: Volume = { holdS: 0, reps: 0 };
  exercises.forEach((e, i) => { if (done[i]) paid[kindOf(e)] += extras[i] ?? 0; });
  const holdS = Math.max(0, debt.holdS - paid.holdS); const reps = Math.max(0, debt.reps - paid.reps);
  // Splacený dluh drží původní podíl; doběhlý typ podíl vynuluje.
  const after: TrainingDebt = { holdS, reps, share: { holdS: holdS > 0 ? debt.share.holdS : 0, reps: reps > 0 ? debt.share.reps : 0 } };
  return addSkipped(after, exercises.filter((_, i) => !done[i]));
}

/** Platí lekce pro sérii a odemčení? Aspoň polovina cviků odcvičená. */
export const lessonCounts = (done: readonly boolean[]): boolean =>
  done.length > 0 && done.filter(Boolean).length >= Math.ceil(done.length * ADAPT.minDoneRatio);

/** Část odcvičených cviků (0–1) pro poměrné XP základu lekce. */
export const doneRatio = (done: readonly boolean[]): number => (done.length === 0 ? 1 : done.filter(Boolean).length / done.length);

/** Smí se cvik `index` přeskočit? Jen když i po přeskočení zbytek lekce (vše odcvičené) ještě splní polovinu,
 *  takže lekce nikdy neskončí slepou uličkou „nezapočítá se“. `done` = výsledky cviků před `index`. */
export function canSkip(done: readonly boolean[], index: number, total: number): boolean {
  const doneBefore = done.slice(0, index).filter(Boolean).length;
  const maxDone = doneBefore + (total - index - 1);
  return maxDone >= Math.ceil(total * ADAPT.minDoneRatio);
}
