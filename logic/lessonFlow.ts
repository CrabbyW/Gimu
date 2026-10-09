/** Fáze obrazovky lekce: cviky po jednom → ukládání výsledku → oslava (Task 13). */
export type LessonPhase = { kind: 'exercise'; index: number } | { kind: 'completing' } | { kind: 'celebrate' };

/** Další fáze po dokončení aktuální. Po posledním cviku přijde `completing`, oslava je konečná. */
export function nextPhase(p: LessonPhase, exerciseCount: number): LessonPhase {
  if (p.kind === 'exercise') return p.index + 1 < exerciseCount ? { kind: 'exercise', index: p.index + 1 } : { kind: 'completing' };
  return { kind: 'celebrate' };
}

// UX pass U1: pauza mezi cviky. `rest.next` = index cviku, který přijde po pauze.
export const REST = { seconds: 30, extendS: 15, maxS: 90 } as const;
export type FlowPhase = LessonPhase | { kind: 'rest'; next: number };

/** Jako `nextPhase`, ale mezi cviky vloží pauzu (`withRest`). Po pauze jde cvik `next`; po posledním cviku pauza není. */
export function nextFlowPhase(p: FlowPhase, exerciseCount: number, withRest = true): FlowPhase {
  if (p.kind === 'rest') return { kind: 'exercise', index: p.next };
  const n = nextPhase(p, exerciseCount);
  if (withRest && p.kind === 'exercise' && n.kind === 'exercise') return { kind: 'rest', next: n.index };
  return n;
}

/** Délka pauzy po „+15 s“, se stropem. */
export const extendRest = (s: number) => Math.min(REST.maxS, s + REST.extendS);
