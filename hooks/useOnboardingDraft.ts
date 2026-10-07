import { create } from 'zustand';
import { copy } from '@/data/copy';
import { DREAM_OPTIONS, type DreamGlyphId, type DreamOptionId } from '@/data/dreams';
import { MILESTONE_PRESETS } from '@/data/milestones';
import { PATHS } from '@/data/paths';
import { composeDreamSentence, defaultDraftGoals, type OnboardingDraftValues } from '@/logic/onboarding';
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

export interface DreamChoice { id: DreamOptionId; glyph: DreamGlyphId; title: string; line: string; sentence: string }
const dreamChoices = (path: PathId): DreamChoice[] =>
  DREAM_OPTIONS[path].map((o) => {
    const meta = copy.onboarding.dream.options[o.id];
    return { ...o, ...meta, sentence: composeDreamSentence(meta.title, meta.line) };
  });
const DREAM_CHOICES: Record<PathId, DreamChoice[]> = {
  power: dreamChoices('power'), bodyControl: dreamChoices('bodyControl'), strength: dreamChoices('strength'),
};
const ALL_DREAM_SENTENCES = new Set(PATH_ORDER.flatMap((p) => DREAM_CHOICES[p].map((d) => d.sentence)));

/** Karty vize pro zvolenou cestu (R36); `dreamBody` ukládá `"<Titulek>. <Řádek>"` vybrané karty (R41). */
export const useDreamOptions = (path: PathId | null): readonly DreamChoice[] => (path ? DREAM_CHOICES[path] : []);

/** Je text větou některé předvolby (jakékoli cesty)? Vlastní text se při změně cesty zachová, předvolba ne. */
export const isDreamPreset = (dreamBody: string): boolean => ALL_DREAM_SENTENCES.has(dreamBody);
export type { DreamGlyphId } from '@/data/dreams';

/** Krátký onboarding: výchozí vize a milníky zvolené cesty (doplní se později přes „Finish setup“). */
export function useDefaultDraftGoals(path: PathId | null) {
  const presets = useMilestonePresets(path).map((m) => ({ ...m, current: 0, custom: false }));
  const dreams = useDreamOptions(path);
  return defaultDraftGoals(presets, dreams.map((d) => d.sentence));
}
