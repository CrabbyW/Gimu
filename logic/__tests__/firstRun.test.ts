import { buildInitialProfile, defaultDraftGoals, needsSetup } from '@/logic/onboarding';
import { nextGuide, type GuideId } from '@/logic/guide';
import type { Milestone, UserProfile } from '@/types';

const ms = (id: string): Milestone => ({ id, label: id, target: 10, unit: 'reps', current: 0, custom: false });
const now = new Date(2026, 9, 7, 12);

describe('defaultDraftGoals', () => {
  it('vize = první věta cesty, milníky = první 2 předvolby', () => {
    const r = defaultDraftGoals([ms('a'), ms('b'), ms('c')], ['First dream.', 'Second.']);
    expect(r.dreamBody).toBe('First dream.');
    expect(r.milestones.map((m) => m.id)).toEqual(['a', 'b']);
  });
  it('bez předvoleb prázdné, nepadá', () => {
    expect(defaultDraftGoals([], [])).toEqual({ dreamBody: '', milestones: [] });
  });
});

describe('needsSetup a first run', () => {
  const base = buildInitialProfile({ path: 'power', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' } }, now);
  it('starý profil (bez polí) setup nepotřebuje a není first run', () => {
    expect(needsSetup(base)).toBe(false);
    expect(nextGuide('map', base)).toBeNull();
  });
  it('krátký onboarding: setupDone false → potřebuje setup, first run', () => {
    const p = buildInitialProfile({ path: 'power', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' }, setupDone: false }, now);
    expect(needsSetup(p)).toBe(true);
    expect(p.guideSeen).toEqual([]);
  });
  it('hotový setup', () => expect(needsSetup({ ...base, setupDone: true })).toBe(false));
});

describe('nextGuide', () => {
  const fresh = (seen: GuideId[]): UserProfile =>
    ({ ...buildInitialProfile({ path: 'power', dreamBody: 'x', milestones: [], weightGoal: { kind: 'none' }, setupDone: false }, now), guideSeen: seen });
  it('každá obrazovka má svou bublinu, jen jednou', () => {
    expect(nextGuide('map', fresh([]))).toBe('mapTour');
    expect(nextGuide('lesson', fresh([]))).toBe('lessonHold');
    expect(nextGuide('celebration', fresh([]))).toBe('celebrationFirst');
    expect(nextGuide('map', fresh(['mapStart']))).toBeNull();
  });
  it('bez profilu nic', () => expect(nextGuide('map', null)).toBeNull());
});
