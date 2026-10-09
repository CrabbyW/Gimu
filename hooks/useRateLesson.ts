import { useCallback } from 'react';
import { services } from '@/services';
import type { Feel } from '@/types';

/** UX pass U2: hodnocení pocitu po lekci pro jeden pokus. Služba je idempotentní pro stejné `attemptId`. */
export function useRateLesson(attemptId: string) {
  return useCallback((feel: Feel) => services.user.rateLesson(attemptId, feel), [attemptId]);
}
