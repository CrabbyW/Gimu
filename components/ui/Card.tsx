import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  children?: ReactNode;
  /** Kompaktní padding 16 (husté seznamy); výchozí 24. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Karta (Teplá litina §2.7): `surface`, radius 14, padding 24. Odděluje jen tónem: bez obrysu a stínu. */
export function Card({ children, compact = false, style }: Props) {
  const { c, radius, space } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderRadius: radius.l, padding: compact ? space.m : space.l }, style]}>{children}</View>;
}
