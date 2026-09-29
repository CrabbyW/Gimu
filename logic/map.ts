import type { Lesson } from '@/types';

export type NodeState = 'locked' | 'current' | 'done';
const sorted = (ls: Lesson[]) => [...ls].sort((a, b) => a.section - b.section || a.order - b.order);

export function nextLessonId(lessons: Lesson[], completed: ReadonlySet<string>): string | null {
  return sorted(lessons).find((l) => !completed.has(l.id))?.id ?? null;
}

export function nodeStates(lessons: Lesson[], completed: ReadonlySet<string>): Map<string, NodeState> {
  const next = nextLessonId(lessons, completed);
  return new Map(sorted(lessons).map((l) => [l.id, completed.has(l.id) ? 'done' : l.id === next ? 'current' : 'locked']));
}
