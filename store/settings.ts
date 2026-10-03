import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MascotStage } from '@/types';
import { useDb } from './db';

export type ThemePreference = 'system' | 'light' | 'dark';
interface PersistedSettings {
  theme: ThemePreference; devTimeOffsetMs: number;
  reminderEnabled: boolean; reminderHour: number;
  /** Dev menu: zobrazená stage opice místo skutečné. */
  stageOverride: MascotStage | null;
  /** Dva nezávislé přepínače (motion spec §6.2): vypnutí haptiky neumlčí zvuk a naopak. */
  hapticsEnabled: boolean; soundEnabled: boolean;
}
const DEFAULTS: PersistedSettings = {
  theme: 'system', devTimeOffsetMs: 0, reminderEnabled: false, reminderHour: 18, stageOverride: null, hapticsEnabled: true, soundEnabled: true,
};
const STAGES: readonly unknown[] = [1, 2, 3];
const THEMES: readonly unknown[] = ['system', 'light', 'dark'];

/** Doplní chybějící/poškozená pole výchozími hodnotami (v1 → v2 přidává připomínku a stageOverride, v3 přepínače haptiky a zvuku). */
export function migrateSettings(persisted: unknown): PersistedSettings {
  const o = typeof persisted === 'object' && persisted !== null ? (persisted as Record<string, unknown>) : {};
  const hour = o.reminderHour;
  return {
    theme: THEMES.includes(o.theme) ? (o.theme as ThemePreference) : DEFAULTS.theme,
    devTimeOffsetMs: typeof o.devTimeOffsetMs === 'number' && Number.isFinite(o.devTimeOffsetMs) ? o.devTimeOffsetMs : 0,
    reminderEnabled: typeof o.reminderEnabled === 'boolean' ? o.reminderEnabled : DEFAULTS.reminderEnabled,
    reminderHour: typeof hour === 'number' && Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULTS.reminderHour,
    stageOverride: STAGES.includes(o.stageOverride) ? (o.stageOverride as MascotStage) : null,
    hapticsEnabled: typeof o.hapticsEnabled === 'boolean' ? o.hapticsEnabled : DEFAULTS.hapticsEnabled,
    soundEnabled: typeof o.soundEnabled === 'boolean' ? o.soundEnabled : DEFAULTS.soundEnabled,
  };
}
interface SettingsState extends PersistedSettings {
  /** Hydratace z úložiště skončila (i neúspěšně — pak platí výchozí hodnoty). Neukládá se. */
  hydrated: boolean;
  setTheme(t: ThemePreference): void;
  setDevTimeOffset(ms: number): void;
  setReminderEnabled(enabled: boolean): void;
  setReminderHour(hour: number): void;
  setStageOverride(stage: MascotStage | null): void;
  setHapticsEnabled(enabled: boolean): void;
  setSoundEnabled(enabled: boolean): void;
  /** Dev menu „Reset appky“: vše zpět na výchozí, téma zůstává. */
  resetDev(): void;
}
export const useSettings = create<SettingsState>()(persist((set) => ({
  ...DEFAULTS, hydrated: false,
  setTheme: (theme) => set({ theme }), setDevTimeOffset: (devTimeOffsetMs) => set({ devTimeOffsetMs }),
  setReminderEnabled: (reminderEnabled) => set({ reminderEnabled }),
  setReminderHour: (reminderHour) => set({ reminderHour }),
  setStageOverride: (stageOverride) => set({ stageOverride }),
  setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  resetDev: () => set((st) => ({ ...DEFAULTS, theme: st.theme })),
}), {
  name: 'opice-settings', version: 3, storage: createJSONStorage(() => AsyncStorage),
  partialize: (s): PersistedSettings => ({
    theme: s.theme, devTimeOffsetMs: s.devTimeOffsetMs,
    reminderEnabled: s.reminderEnabled, reminderHour: s.reminderHour, stageOverride: s.stageOverride,
    hapticsEnabled: s.hapticsEnabled, soundEnabled: s.soundEnabled,
  }),
  migrate: (persisted) => migrateSettings(persisted),
  onRehydrateStorage: () => (_state, error) => {
    // zustand při chybě (poškozený JSON, odmítnutí AsyncStorage) hasHydrated nenastaví;
    // vlastní příznak zajistí, že splash nezůstane viset a platí výchozí nastavení (spec §9).
    if (error) console.warn('[settings] hydratace selhala, výchozí nastavení', error);
    useSettings.setState({ hydrated: true });
    // Hooky mohly načíst data dřív, než byl znám dev posun času → znovu načíst.
    useDb.setState((s) => ({ revision: s.revision + 1 }));
  },
}));
