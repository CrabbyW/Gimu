// Kontext místo `useIsFocused`: ten mimo navigaci (testy, kořen) hází; kontext je tam null.
import { NavigationContext } from 'expo-router/build/react-navigation/core';
import { useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { skiaState } from '@/lib/skiaReady';
import { shouldMountCanvas } from './canvasBudget';

interface Props {
  children: ReactNode;
  /** Co ukázat bez Skia (web bez CanvasKit, rozostřená obrazovka na webu). Výchozí prázdný `View` se stylem `style`, takže layout drží rozměr. */
  fallback?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Zaostření obrazovky; mimo navigaci (testy, kořen) vždy true. Na nativu se neodebírá, výsledek je tam vždy „kreslit“. */
function useScreenFocused(): boolean {
  const nav = useContext(NavigationContext);
  const [focused, setFocused] = useState(() => (nav ? nav.isFocused() : true));
  useEffect(() => {
    if (!nav || Platform.OS !== 'web') return;
    const offFocus = nav.addListener('focus', () => setFocused(true));
    const offBlur = nav.addListener('blur', () => setFocused(false));
    return () => { offFocus(); offBlur(); };
  }, [nav]);
  return focused;
}

/** Tečková grafika je ozdoba nad funkčním UI: když se CanvasKit nenačte, vykreslí se tichý fallback
 *  a obrazovka zůstane použitelná (spec §9). Na webu navíc kreslí jen zaostřená obrazovka (rozpočet pláten). */
export function SkiaGuard({ children, fallback, style }: Props) {
  const focused = useScreenFocused();
  if (!skiaState.ready || !shouldMountCanvas(Platform.OS, focused)) return <>{fallback ?? <View style={style} />}</>;
  return <>{children}</>;
}
