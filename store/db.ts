import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserProfile } from '@/types';
import { DB_VERSION, migrateDb, type PersistedDb } from './migrate';

interface DbState extends PersistedDb {
  hydrated: boolean;
  /** Roste s každým zápisem. Hooky podle něj znovu načtou data ze services. */
  revision: number;
  setProfile(profile: UserProfile | null): void;
}

export const useDb = create<DbState>()(
  persist(
    (set) => ({
      profile: null, hydrated: false, revision: 0,
      setProfile: (profile) => set((s) => ({ profile, revision: s.revision + 1 })),
    }),
    {
      name: 'opice-db',
      version: DB_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s): PersistedDb => ({ profile: s.profile }),
      migrate: (persisted, version) => migrateDb(persisted, version),
      merge: (persisted, current) => ({ ...current, ...migrateDb(persisted, DB_VERSION) }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) console.warn('[db] hydratace selhala, začínám načisto', error);
        useDb.setState({ hydrated: true });
      },
    },
  ),
);
