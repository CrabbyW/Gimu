import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';
import type { SeasonThemeId } from '@/types';
import { buildTheme, resolveScheme, type Theme } from './buildTheme';

export const ThemeContext = createContext<Theme | null>(null);

interface Props { seasonThemeId: SeasonThemeId | null; children: ReactNode }

export function ThemeProvider({ seasonThemeId, children }: Props) {
  const pref = useSettings((s) => s.theme);
  const system = useColorScheme();
  const scheme = resolveScheme(pref, system);
  const theme = useMemo(() => buildTheme(scheme, seasonThemeId), [scheme, seasonThemeId]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
