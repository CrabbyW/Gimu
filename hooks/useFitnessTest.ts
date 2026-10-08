import { useCallback } from 'react';
import { services } from '@/services';

export interface FitnessTestInput { pushups: number; plankS: number; kneePushups: boolean; readiness: 'clear' | 'consult' }

/** Vstupní test (elite fáze 5): uložení výsledku přes service (očištění vstupů dělá `logic/fitnessTest`).
 *  Vrací `true`/`false` místo výjimky, obrazovka ukáže chybu a nechá uživatele zkusit znovu. */
export function useSaveFitnessTest() {
  return useCallback(async (t: FitnessTestInput): Promise<boolean> => {
    try { await services.user.saveFitnessTest(t, new Date()); return true; } catch { return false; }
  }, []);
}
