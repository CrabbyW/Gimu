import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';
interface SettingsState { theme: ThemePreference; devTimeOffsetMs: number; setTheme(t: ThemePreference): void; setDevTimeOffset(ms: number): void }
export const useSettings = create<SettingsState>()(persist((set) => ({
  theme: 'system', devTimeOffsetMs: 0,
  setTheme: (theme) => set({ theme }), setDevTimeOffset: (devTimeOffsetMs) => set({ devTimeOffsetMs }),
}), { name: 'opice-settings', version: 1, storage: createJSONStorage(() => AsyncStorage) }));
