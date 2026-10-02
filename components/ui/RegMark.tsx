import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

/** Jedna registrační značka `+` (8 pt, vlasové ramena v `muted`), středem v bodě (x, y) rodiče. */
function Cross({ x, y }: { x: 'left' | 'right'; y: 'top' | 'bottom' }) {
  const { c, size } = useTheme();
  const s = size.regMark;
  const at: ViewStyle = {
    position: 'absolute', width: s, height: s,
    ...(x === 'left' ? { left: -s / 2 } : { right: -s / 2 }),
    ...(y === 'top' ? { top: -s / 2 } : { bottom: -s / 2 }),
  };
  return (
    <View pointerEvents="none" style={at}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: (s - 1) / 2, height: 1, backgroundColor: c.muted }} />
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: (s - 1) / 2, width: 1, backgroundColor: c.muted }} />
    </View>
  );
}

/** Obal hero karty (R42): `+` značky v rozích. Jen pro hero karty, ne pro běžné bloky.
 *  Značky jsou dekor bez sémantiky, čtečka je ignoruje. */
export function RegMark({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      {children}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
        <Cross x="left" y="top" />
        <Cross x="right" y="top" />
        <Cross x="left" y="bottom" />
        <Cross x="right" y="bottom" />
      </View>
    </View>
  );
}
