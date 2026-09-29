import { useContext } from 'react';
import type { Theme } from './buildTheme';
import { ThemeContext } from './ThemeProvider';

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme() musí být uvnitř <ThemeProvider>.');
  return theme;
}
