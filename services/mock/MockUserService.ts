import { buildInitialProfile } from '@/logic/onboarding';
import { weekStart } from '@/logic/dates';
import { now } from '@/lib/clock';
import { useDb } from '@/store/db';
import type { UserService } from '../contracts';

const requireProfile = () => {
  const p = useDb.getState().profile;
  if (!p) throw new Error('Profil neexistuje, nejdřív onboarding.');
  return p;
};

export class MockUserService implements UserService {
  async getProfile() { return useDb.getState().profile; }
  async completeOnboarding(input: Parameters<UserService['completeOnboarding']>[0]) {
    const profile = buildInitialProfile(input, now());
    useDb.getState().setProfile(profile);
    return profile;
  }
  async logWeight(kg: number, now: Date) {
    const p = requireProfile(); const ws = weekStart(now);
    useDb.getState().setProfile({ ...p, weights: [...p.weights.filter((w) => w.weekStart !== ws), { weekStart: ws, kg }].sort((a, b) => a.weekStart.localeCompare(b.weekStart)) });
  }
  async updateMilestone(id: string, current: number) {
    const p = requireProfile();
    useDb.getState().setProfile({ ...p, milestones: p.milestones.map((m) => (m.id === id ? { ...m, current } : m)) });
  }
  async reset() { useDb.getState().setProfile(null); }
}
