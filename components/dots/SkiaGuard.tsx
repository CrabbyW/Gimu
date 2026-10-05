import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { skiaState } from '@/lib/skiaReady';

interface Props {
  children: ReactNode;
  /** Co ukázat bez Skia (web bez CanvasKit). Výchozí prázdný `View` se stylem `style`, takže layout drží rozměr. */
  fallback?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Tečková grafika je ozdoba nad funkčním UI: když se CanvasKit nenačte, vykreslí se tichý fallback
 *  a obrazovka zůstane použitelná (spec §9). Čte stav při renderu, layout ho nastaví před prvním vykreslením. */
export function SkiaGuard({ children, fallback, style }: Props) {
  if (!skiaState.ready) return <>{fallback ?? <View style={style} />}</>;
  return <>{children}</>;
}
