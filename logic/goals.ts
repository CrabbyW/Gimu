import type { Milestone, PathId, UserProfile, WeightGoal } from '@/types';
import { DREAM_MAX_LENGTH, isDreamValid, MILESTONES_MAX, MILESTONES_MIN, validateWeightGoal } from './onboarding';

/** Úprava cílů po onboardingu (Nastavení → Cíle). Každé pole je volitelné: měnit jde jen část. */
export interface GoalsPatch { milestones?: Milestone[]; weightGoal?: WeightGoal; dreamBody?: string; path?: PathId }
export type GoalsError = 'milestoneCount' | 'milestoneTarget' | 'weight' | 'dream' | 'path';

const PATHS: readonly PathId[] = ['power', 'bodyControl', 'strength'];
const validTarget = (m: Milestone) => Number.isInteger(m.target) && m.target >= 1 && m.target <= 9999 && (m.unit !== 'done' || m.target === 1);

/** Použije změny cílů na profil, nebo vrátí první chybu. Pokrok se nezahazuje:
 *  milník se stejným id si drží `current`, změna cesty ponechá historii lekcí (mapa každé cesty si ji najde podle id). */
export function applyGoalsPatch(p: UserProfile, patch: GoalsPatch): { profile: UserProfile } | { error: GoalsError } {
  const next: UserProfile = { ...p };
  if (patch.milestones) {
    if (patch.milestones.length < MILESTONES_MIN || patch.milestones.length > MILESTONES_MAX) return { error: 'milestoneCount' };
    if (!patch.milestones.every(validTarget)) return { error: 'milestoneTarget' };
    const before = new Map(p.milestones.map((m) => [m.id, m]));
    next.milestones = patch.milestones.map((m) => ({ ...m, label: m.label.trim(), current: before.get(m.id)?.current ?? m.current }));
  }
  if (patch.weightGoal) {
    const w = patch.weightGoal;
    if (w.kind !== 'none' && validateWeightGoal(w.kind, w.startKg, w.targetKg) !== 'ok') return { error: 'weight' };
    next.weightGoal = w;
  }
  if (patch.dreamBody !== undefined) {
    const d = patch.dreamBody.trim();
    if (!isDreamValid(d) || d.length > DREAM_MAX_LENGTH) return { error: 'dream' };
    next.dreamBody = d;
  }
  if (patch.path !== undefined) {
    if (!PATHS.includes(patch.path)) return { error: 'path' };
    next.path = patch.path;
  }
  return { profile: next };
}
