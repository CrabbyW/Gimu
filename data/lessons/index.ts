import type { Lesson, PathId } from '@/types';
import { BODY_CONTROL_LESSONS } from './bodyControl';
import { POWER_LESSONS } from './power';
import { STRENGTH_LESSONS } from './strength';

export const LESSONS_BY_PATH: Record<PathId, Lesson[]> = {
  bodyControl: BODY_CONTROL_LESSONS, power: POWER_LESSONS, strength: STRENGTH_LESSONS,
};
export const LESSONS: Lesson[] = Object.values(LESSONS_BY_PATH).flat();
