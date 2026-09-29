import { createContext, useContext } from 'react';
import type { View } from 'react-native';

export interface RevealOnFocus {
  /** Pole dostalo fokus: rolovací obrazovka ho (i s chybovým řádkem) posune nad klávesnici. */
  focus(target: View | null): void;
  blur(target: View | null): void;
}

/** Poskytuje `Screen` se `scroll`; mimo něj je null a pole se nikam neposouvá. */
export const RevealOnFocusContext = createContext<RevealOnFocus | null>(null);
export const useRevealOnFocus = () => useContext(RevealOnFocusContext);
