/** Fáze obrazovky lekce: cviky po jednom → ukládání výsledku → oslava (Task 13). */
export type LessonPhase = { kind: 'exercise'; index: number } | { kind: 'completing' } | { kind: 'celebrate' };

/** Další fáze po dokončení aktuální. Po posledním cviku přijde `completing`, oslava je konečná. */
export function nextPhase(p: LessonPhase, exerciseCount: number): LessonPhase {
  if (p.kind === 'exercise') return p.index + 1 < exerciseCount ? { kind: 'exercise', index: p.index + 1 } : { kind: 'completing' };
  return { kind: 'celebrate' };
}
