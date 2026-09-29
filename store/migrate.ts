import type { UserProfile } from '@/types';

export const DB_VERSION = 1;
export interface PersistedDb { profile: UserProfile | null }
const EMPTY: PersistedDb = { profile: null };

function isProfile(p: unknown): p is UserProfile {
  if (typeof p !== 'object' || p === null) return false;
  const o = p as Record<string, unknown>;
  return typeof o.path === 'string' && Array.isArray(o.activity) && Array.isArray(o.milestones) && typeof o.weightGoal === 'object';
}

export function migrateDb(persisted: unknown, version: number): PersistedDb {
  if (version > DB_VERSION || typeof persisted !== 'object' || persisted === null) return EMPTY;
  const profile = (persisted as { profile?: unknown }).profile ?? null;
  // TODO(fáze 2): migrace mezi verzemi schématu přidávat jako if (version < N) {...}
  if (profile === null) return EMPTY;
  return isProfile(profile) ? { profile } : EMPTY;
}
