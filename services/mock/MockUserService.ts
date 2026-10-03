import { applyGoalsPatch, type GoalsPatch } from '@/logic/goals';
import { buildInitialProfile } from '@/logic/onboarding';
import { COSMETICS } from '@/data/cosmetics';
import { DEV_XP_LESSON_ID } from '@/logic/activity';
import { newlyUnlocked } from '@/logic/cosmetics';
import { newlyCompleted } from '@/logic/progress';
import { toISODate, weekStart } from '@/logic/dates';
import { now as clockNow } from '@/lib/clock';
import { useDb } from '@/store/db';
import type { MilestoneUpdateResult, UserService } from '../contracts';
import { buildDemoProfile } from './demoData';
import { ownershipCtx } from './ownership';

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
    const value = Math.max(0, current);
    const milestones = p.milestones.map((m) => (m.id === id ? { ...m, current: value } : m));
    useDb.getState().setProfile({ ...p, milestones });
    // Milestone kosmetika se odvozuje z pravidel (ruling 14); hlásí se jen nově odemčená.
    const unlockedCosmeticIds = newlyUnlocked(COSMETICS, ownershipCtx(p), ownershipCtx({ ...p, milestones }));
    return { completed: newlyCompleted(p.milestones, milestones).includes(id), unlockedCosmeticIds };
  }
  async updateGoals(patch: GoalsPatch) {
    const p = requireProfile();
    const r = applyGoalsPatch(p, patch);
    if ('error' in r) throw new Error(r.error);
    // Milestone kosmetika se odvozuje z pravidel; změna cílů ji jen přepočítá při dalším čtení.
    useDb.getState().setProfile(r.profile);
    return r.profile;
  }
  async grantDevXp(amount: number, now: Date) {
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('Dev XP musí být kladné celé číslo.');
    const p = requireProfile();
    const event = { id: `${DEV_XP_LESSON_ID}-${now.getTime()}-${p.activity.length}`, at: now.toISOString(), day: toISODate(now), lessonId: DEV_XP_LESSON_ID, xp: amount };
    useDb.getState().setProfile({ ...p, activity: [...p.activity, event] });
  }
  async reset() { useDb.getState().setProfile(null); }
  async loadDemo(now: Date) { useDb.getState().setProfile(buildDemoProfile(now)); }
}
