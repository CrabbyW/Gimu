import { create } from 'zustand';
import { MILESTONE_PRESETS } from '@/data/milestones';
import type { Milestone, PathId } from '@/types';

/** Nepersistovaný koncept onboardingu — mizí při zabití appky. */
interface Draft {
  path: PathId | null;
  dreamBody: string;
  milestones: Milestone[];
  weightKind: 'lose' | 'gain' | 'none';
  currentKg: string;
  targetKg: string;
  set(patch: Partial<Omit<Draft, 'set' | 'reset'>>): void;
  reset(): void;
}

const initial = { path: null, dreamBody: '', milestones: [], weightKind: 'none' as const, currentKg: '', targetKg: '' };

export const useOnboardingDraft = create<Draft>()((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));

export function useMilestonePresets(path: PathId | null) {
  return path ? [...MILESTONE_PRESETS[path], ...MILESTONE_PRESETS.general] : [];
}
