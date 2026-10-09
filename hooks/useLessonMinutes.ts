import { useMemo } from 'react';
import { EXERCISES } from '@/data/exercises';
import { scaledAmount, scaleFromTest } from '@/logic/fitnessTest';
import { estMinutes } from '@/logic/lessonDuration';
import type { LessonPathView } from '@/services/contracts';
import type { Exercise, FitnessTest, Progression } from '@/types';
import { combineScale } from '@/logic/progression';

/** Odhad minut pro každou lekci cesty (`estMinutes` z jejích cviků), podle id lekce.
 *  Neznámý cvik se přeskočí; lekce bez cviků dostane minimum 1 minutu (pravidlo `estMinutes`). */
export function useLessonMinutes(view: LessonPathView | null, test?: FitnessTest | null, progression?: Progression): Record<string, number> {
  return useMemo(() => {
    const out: Record<string, number> = {};
    if (!view) return out;
    // Vstupní test (elite fáze 5): minuty podle škálovaných dávek, stejně jako lekce.
    const scale = combineScale(scaleFromTest(test), progression);
    for (const s of view.sections) {
      for (const n of s.nodes) {
        const list = n.lesson.exerciseIds.map((id) => EXERCISES[id]).filter((e): e is Exercise => e !== undefined);
        out[n.lesson.id] = estMinutes(list.map((e) => ({ type: e.type, amount: scaledAmount(e, scale) })));
      }
    }
    return out;
  }, [view, test, progression]);
}
