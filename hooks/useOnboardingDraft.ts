import { create } from 'zustand';
import { MILESTONE_PRESETS } from '@/data/milestones';
import { PATHS } from '@/data/paths';
import type { OnboardingDraftValues } from '@/logic/onboarding';
import type { Milestone, PathId, PathMeta } from '@/types';

interface DraftValues extends OnboardingDraftValues {
  /** Vytvořené vlastní milníky. `milestones` je jen výběr, takže odznačený vlastní milník nezmizí. */
  customMilestones: Milestone[];
}

/** Nepersistovaný koncept onboardingu — mizí při zabití appky. */
interface Draft extends DraftValues {
  set(patch: Partial<DraftValues>): void;
  reset(): void;
}

const initial: DraftValues = {
  path: null, dreamBody: '', milestones: [], customMilestones: [], weightKind: 'none', currentKg: '', targetKg: '',
};

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
