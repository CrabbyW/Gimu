import { create } from 'zustand';
import { MILESTONE_PRESETS } from '@/data/milestones';
import { PATHS } from '@/data/paths';
import type { OnboardingDraftValues } from '@/logic/onboarding';
import type { PathId, PathMeta } from '@/types';

/** Nepersistovaný koncept onboardingu — mizí při zabití appky. */
interface Draft extends OnboardingDraftValues {
  set(patch: Partial<OnboardingDraftValues>): void;
  reset(): void;
}

const initial: OnboardingDraftValues = { path: null, dreamBody: '', milestones: [], weightKind: 'none', currentKg: '', targetKg: '' };

export const useOnboardingDraft = create<Draft>()((set) => ({
  ...initial,
  set: (patch) => set(patch),
  reset: () => set(initial),
}));

export function useMilestonePresets(path: PathId | null) {
  return path ? [...MILESTONE_PRESETS[path], ...MILESTONE_PRESETS.general] : [];
}

const PATH_ORDER: readonly PathId[] = ['power', 'bodyControl', 'strength'];
const PATH_OPTIONS: readonly PathMeta[] = PATH_ORDER.map((id) => PATHS[id]);

/** Cesty v pořadí karet onboardingu. UI nesmí číst `data/`, proto jde přes hook. */
export const usePathOptions = (): readonly PathMeta[] => PATH_OPTIONS;
