import { COSMETICS } from '@/data/cosmetics';
import { weekStart } from '@/logic/dates';
import type { PathId, UserProfile } from '@/types';
import { sanitizeEquipped } from '@/logic/cosmetics';
import { activeDays, longestStreak } from '@/logic/streak';

export const DB_VERSION = 2;
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
    && typeof o.leagueWeek === 'string'
    && (o.lastLeagueResult === null || isPlainObject(o.lastLeagueResult))
    && Array.isArray(o.badges)
    && isPlainObject(o.seasonClaims)
  );
}

/** v1 → v2: doplní ligu týdne, odznaky, převzaté odměny a `start` milestone cílů sezóny.
 *  Existující hodnoty (i v1 pole: dreamBody věta R41, milníky, váhy, aktivita…) zůstávají beze změny. */
function upgradeV1(p: Record<string, unknown>): Record<string, unknown> {
  const created = typeof p.createdAt === 'string' ? new Date(p.createdAt) : new Date(NaN);
  const goals = isPlainObject(p.seasonGoals)
    ? Object.fromEntries(Object.entries(p.seasonGoals).map(([id, g]) => {
      if (isPlainObject(g) && g.kind === 'milestone' && typeof g.start !== 'number') return [id, { ...g, start: g.current }];
      return [id, g];
    }))
    : p.seasonGoals;
  return {
    ...p,
    seasonGoals: goals,
    // Poškozené createdAt: leagueWeek chybí → isProfile profil zahodí (jako každý jiný poškozený profil).
    leagueWeek: p.leagueWeek ?? (Number.isNaN(created.getTime()) ? undefined : weekStart(created)),
    lastLeagueResult: p.lastLeagueResult ?? null,
    badges: p.badges ?? [],
    seasonClaims: p.seasonClaims ?? {},
  };
}

const isVolume = (v: unknown): boolean =>
  isPlainObject(v) && Number.isFinite(v.holdS) && Number.isFinite(v.reps) && (v.holdS as number) >= 0 && (v.reps as number) >= 0;
const isDebt = (d: unknown): d is NonNullable<UserProfile['trainingDebt']> => isVolume(d) && isPlainObject(d) && isVolume(d.share);

/** Zahodí nasazené položky s neznámým id, ve špatném slotu nebo už neodemčené. */
function cleanEquipped(p: UserProfile): UserProfile['equipped'] {
  return sanitizeEquipped(p.equipped, COSMETICS, { owned: p.owned, milestones: p.milestones, longestStreak: longestStreak(activeDays(p.activity)) });
}

export function migrateDb(persisted: unknown, version: number): PersistedDb {
  if (version > DB_VERSION || typeof persisted !== 'object' || persisted === null) return EMPTY;
  let profile = (persisted as { profile?: unknown }).profile ?? null;
  if (profile === null) return EMPTY;
  if (version < 2 && isPlainObject(profile)) profile = upgradeV1(profile);
  if (isProfile(profile)) {
    // Poškozený dluh tréninku (R44) se zahodí, profil zůstává: dluh je jen doplněk, ne historie.
    const { trainingDebt, ...rest } = profile;
    return { profile: { ...rest, equipped: cleanEquipped(profile), ...(isDebt(trainingDebt) ? { trainingDebt } : {}) } };
  }
  console.warn('[db] poškozený profil, reset na onboarding');
  return EMPTY;
}
