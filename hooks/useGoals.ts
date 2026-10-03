import { useCallback } from 'react';
import type { GoalsError, GoalsPatch } from '@/logic/goals';
import { services } from '@/services';
import { useProfile } from './useProfile';

/** Nastavení → Cíle: aktuální cíle z profilu a jejich uložení. `save` vrací chybu validace (nebo 'unknown' při chybě úložiště) místo výjimky. */
export function useGoals() {
  const profile = useProfile();
  const save = useCallback(async (patch: GoalsPatch): Promise<GoalsError | 'unknown' | null> => {
    try {
      await services.user.updateGoals(patch);
      return null;
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      return (['milestoneCount', 'milestoneTarget', 'weight', 'dream', 'path'] as const).find((c) => c === code) ?? 'unknown';
    }
  }, []);
  return { profile, save };
}
