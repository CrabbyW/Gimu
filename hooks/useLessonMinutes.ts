import { useMemo } from 'react';
import { EXERCISES } from '@/data/exercises';
import { estMinutes } from '@/logic/lessonDuration';
import type { LessonPathView } from '@/services/contracts';
import type { Exercise } from '@/types';

/** Odhad minut pro každou lekci cesty (`estMinutes` z jejích cviků), podle id lekce.
 *  Neznámý cvik se přeskočí; lekce bez cviků dostane minimum 1 minutu (pravidlo `estMinutes`). */
export function useLessonMinutes(view: LessonPathView | null): Record<string, number> {
  return useMemo(() => {
    const out: Record<string, number> = {};
    if (!view) return out;
    for (const s of view.sections) {
      for (const n of s.nodes) {
        const list = n.lesson.exerciseIds.map((id) => EXERCISES[id]).filter((e): e is Exercise => e !== undefined);
        out[n.lesson.id] = estMinutes(list);
      }
    }
    return out;
  }, [view]);
}
