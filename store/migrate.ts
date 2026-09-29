import type { PathId, UserProfile } from '@/types';

export const DB_VERSION = 1;
export interface PersistedDb { profile: UserProfile | null }
const EMPTY: PersistedDb = { profile: null };

const PATH_IDS: readonly PathId[] = ['power', 'bodyControl', 'strength'];

function isWeightGoal(g: unknown): boolean {
  if (typeof g !== 'object' || g === null) return false;
  const o = g as Record<string, unknown>;
  if (o.kind === 'none') return true;
  if (o.kind === 'lose' || o.kind === 'gain') {
    return typeof o.startKg === 'number' && typeof o.targetKg === 'number';
  }
  return false;
}

function isPlainObject(o: unknown): o is Record<string, unknown> {
  return typeof o === 'object' && o !== null && !Array.isArray(o);
}

function isProfile(p: unknown): p is UserProfile {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.path === 'string' && (PATH_IDS as string[]).includes(o.path)
    && Array.isArray(o.activity)
    && Array.isArray(o.milestones)
    && Array.isArray(o.weights)
    && Array.isArray(o.owned)
    && isWeightGoal(o.weightGoal)
    && isPlainObject(o.equipped)
    && isPlainObject(o.seasonGoals)
    && typeof o.leagueTier === 'string'
  );
}

export function migrateDb(persisted: unknown, version: number): PersistedDb {
  if (version > DB_VERSION || typeof persisted !== 'object' || persisted === null) return EMPTY;
  const profile = (persisted as { profile?: unknown }).profile ?? null;
  // TODO(fáze 2): migrace mezi verzemi schématu přidávat jako if (version < N) {...}
  if (profile === null) return EMPTY;
  if (isProfile(profile)) return { profile };
  console.warn('[db] poškozený profil, reset na onboarding');
  return EMPTY;
}
