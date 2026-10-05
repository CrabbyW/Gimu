import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

interface Props {
  children?: ReactNode;
  /** Kompaktní padding 16 (husté seznamy); výchozí 24. */
  compact?: boolean;
  /** Tónová vrstva: `surface` (výchozí, karta na podkladu) nebo `raised` (vystouplý prvek, např. vlastní hodnota). */
  tone?: 'surface' | 'raised';
  style?: StyleProp<ViewStyle>;
}

/** Karta (Teplá litina §2.7): `surface`, radius 14, padding 24. Odděluje tónem, bez obrysu a stínu.
 *  Hloubka a materiál (2026-10-03): jediná vlasová horní hrana `edge` = světlo shora chycené na hraně
 *  odlitku. Na zaoblení se sama vytrácí, takže se čte jako hmota, ne jako rámeček. */
export function Card({ children, compact = false, tone = 'surface', style }: Props) {
  const { c, radius, space } = useTheme();
  return (
    <View
      style={[{
        backgroundColor: c[tone], borderRadius: radius.l, padding: compact ? space.m : space.l,
        borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.edge,
      }, style]}
    >
      {children}
    </View>
  );
}
