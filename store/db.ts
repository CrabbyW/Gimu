import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import { DB_VERSION, migrateDb, type PersistedDb } from './migrate';

/**
 * Čtení úložiště selhalo (AsyncStorage vyhodil chybu, ne poškozený JSON). Dokud trvá, nic se nezapisuje,
 * jinak by výchozí `profile: null` (nebo nový onboarding) přepsal uložený postup. Retry = `retryDbLoad()`.
 */
let readFailed = false;
const guardedStorage = {
  getItem: async (k: string) => {
    try { const v = await AsyncStorage.getItem(k); readFailed = false; return v; } catch (e) { readFailed = true; throw e; }
  },
  setItem: (k: string, v: string) => (readFailed ? Promise.resolve() : AsyncStorage.setItem(k, v)),
  removeItem: (k: string) => (readFailed ? Promise.resolve() : AsyncStorage.removeItem(k)),
};

interface DbState extends PersistedDb {
  hydrated: boolean;
  /** Uložená data nejdou přečíst: appka ukáže chybu s Retry místo onboardingu (QA elite fáze 4). */
  loadFailed: boolean;
  /** Roste s každým zápisem. Hooky podle něj znovu načtou data ze services. */
  revision: number;
  setProfile(profile: UserProfile | null): void;
}

export const useDb = create<DbState>()(
  persist(
    (set) => ({
      profile: null, hydrated: false, loadFailed: false, revision: 0,
      // Při selhaném čtení se profil nemění: zápis by přepsal data, která jen nešla načíst.
      setProfile: (profile) => set((s) => (s.loadFailed ? s : { profile, revision: s.revision + 1 })),
    }),
    {
      name: 'opice-db',
      version: DB_VERSION,
      storage: createJSONStorage(() => guardedStorage),
      partialize: (s): PersistedDb => ({ profile: s.profile }),
      migrate: (persisted, version) => migrateDb(persisted, version),
      merge: (persisted, current) => ({ ...current, ...migrateDb(persisted, DB_VERSION) }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[db] hydratace selhala, začínám načisto', error);
        // revision se musí zvýšit i tady: hooky mountnuté před dokončením hydratace
        // zavolaly service s profile: null a bez tohohle bumpu by se po hydrataci
        // nikdy znovu nenačetly (Review Focus 4).
        useDb.setState((s) => ({ hydrated: true, loadFailed: readFailed, revision: s.revision + 1 }));
      },
    },
  ),
);

/** Znovu načíst uložená data po chybě čtení. */
export function retryDbLoad(): Promise<void> {
  return Promise.resolve(useDb.persist.rehydrate());
}
