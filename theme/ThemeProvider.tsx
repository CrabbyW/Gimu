import { createContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSettings } from '@/store/settings';
import type { SeasonThemeId } from '@/types';
import { buildTheme, resolveScheme, type Scheme, type Theme } from './buildTheme';

export const ThemeContext = createContext<Theme | null>(null);

interface Props {
  seasonThemeId: SeasonThemeId | null;
  /** Vnořený provider pro scénu, která má pevné schéma bez ohledu na volbu (zrození opice je vždy tmavé, spec §7.1). */
  forceScheme?: Scheme;
  children: ReactNode;
}

export function ThemeProvider({ seasonThemeId, forceScheme, children }: Props) {
  const pref = useSettings((s) => s.theme);
  const system = useColorScheme();
  const scheme = forceScheme ?? resolveScheme(pref, system);
  const theme = useMemo(() => buildTheme(scheme, seasonThemeId), [scheme, seasonThemeId]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
