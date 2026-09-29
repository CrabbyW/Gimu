import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useDb } from './db';

export type ThemePreference = 'system' | 'light' | 'dark';
interface PersistedSettings { theme: ThemePreference; devTimeOffsetMs: number }
interface SettingsState extends PersistedSettings {
  /** Hydratace z úložiště skončila (i neúspěšně — pak platí výchozí hodnoty). Neukládá se. */
  hydrated: boolean;
  setTheme(t: ThemePreference): void;
  setDevTimeOffset(ms: number): void;
}
export const useSettings = create<SettingsState>()(persist((set) => ({
  theme: 'system', devTimeOffsetMs: 0, hydrated: false,
  setTheme: (theme) => set({ theme }), setDevTimeOffset: (devTimeOffsetMs) => set({ devTimeOffsetMs }),
}), {
  name: 'opice-settings', version: 1, storage: createJSONStorage(() => AsyncStorage),
  partialize: (s): PersistedSettings => ({ theme: s.theme, devTimeOffsetMs: s.devTimeOffsetMs }),
  onRehydrateStorage: () => (_state, error) => {
    // zustand při chybě (poškozený JSON, odmítnutí AsyncStorage) hasHydrated nenastaví;
    // vlastní příznak zajistí, že splash nezůstane viset a platí výchozí nastavení (spec §9).
    if (error) console.warn('[settings] hydratace selhala, výchozí nastavení', error);
    useSettings.setState({ hydrated: true });
    // Hooky mohly načíst data dřív, než byl znám dev posun času → znovu načíst.
    useDb.setState((s) => ({ revision: s.revision + 1 }));
  },
}));
