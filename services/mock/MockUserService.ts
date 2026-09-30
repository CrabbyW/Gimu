import { buildInitialProfile } from '@/logic/onboarding';
import { COSMETICS } from '@/data/cosmetics';
import { DEV_XP_LESSON_ID } from '@/logic/activity';
import { toISODate, weekStart } from '@/logic/dates';
import { now as clockNow } from '@/lib/clock';
import { useDb } from '@/store/db';
import type { Milestone } from '@/types';
import type { MilestoneUpdateResult, UserService } from '../contracts';

const doneCount = (ms: Milestone[]) => ms.filter((m) => m.current >= m.target).length;

const requireProfile = () => {
  const p = useDb.getState().profile;
  if (!p) throw new Error('Profil neexistuje, nejdřív onboarding.');
  return p;
};

export class MockUserService implements UserService {
  async getProfile() { return useDb.getState().profile; }
  async completeOnboarding(input: Parameters<UserService['completeOnboarding']>[0]) {
    // Druhý onboarding by přepsal profil a smazal `activity` (QA kolo 1) — jakmile profil existuje, odmítnout.
    if (useDb.getState().profile) throw new Error('Profil už existuje, onboarding nelze spustit znovu.');
    const profile = buildInitialProfile(input, clockNow());
    useDb.getState().setProfile(profile);
    return profile;
  }
  async logWeight(kg: number, now: Date) {
    const p = requireProfile(); const ws = weekStart(now);
    useDb.getState().setProfile({ ...p, weights: [...p.weights.filter((w) => w.weekStart !== ws), { weekStart: ws, kg }].sort((a, b) => a.weekStart.localeCompare(b.weekStart)) });
  }
  async updateMilestone(id: string, current: number): Promise<MilestoneUpdateResult> {
    const p = requireProfile();
    const before = p.milestones.find((m) => m.id === id);
    if (!before) throw new Error(`Milník ${id} neexistuje.`);
    const milestones = p.milestones.map((m) => (m.id === id ? { ...m, current } : m));
    useDb.getState().setProfile({ ...p, milestones });
    // Milestone kosmetika se odvozuje z počtu splněných milníků (ruling 14); hlásí se jen nově dosažená.
    // TODO(Task 28): pravidla přes logic/cosmetics.ts.
    const nBefore = doneCount(p.milestones); const nAfter = doneCount(milestones);
    const unlockedCosmeticIds = COSMETICS
      .filter((c) => c.milestoneRule?.kind === 'milestoneCompleted' && nBefore < c.milestoneRule.count && c.milestoneRule.count <= nAfter)
      .map((c) => c.id);
    return { completed: before.current < before.target && current >= before.target, unlockedCosmeticIds };
  }
  async grantDevXp(amount: number, now: Date) {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Dev XP musí být kladné celé číslo.');
    const p = requireProfile();
    const event = { id: `${DEV_XP_LESSON_ID}-${now.getTime()}-${p.activity.length}`, at: now.toISOString(), day: toISODate(now), lessonId: DEV_XP_LESSON_ID, xp: amount };
    useDb.getState().setProfile({ ...p, activity: [...p.activity, event] });
  }
  async reset() { useDb.getState().setProfile(null); }
}
