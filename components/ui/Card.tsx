import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

/** Karta odděluje jen pozadím: bez okraje a stínu (pravidlo jedné oddělovací věci). */
export function Card({ children, style }: { children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c, radius, space } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.l, padding: space.m }, style]}>{children}</View>;
}
