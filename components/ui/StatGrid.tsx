import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';

export interface StatItem {
  /** Hodnota včetně jednotky, např. „1 240 XP“ nebo „Stage 2“. Nuly se neschovávají. */
  value: string;
  label: string;
  /** Hlasitý popis, když hodnota sama nestačí. */
  a11y?: string;
}

/** Mřížka statistik: buňky `surface` vedle sebe, číslo `stat`, popisek `caption muted` pod ním.
 *  Zalamuje se, když se buňky nevejdou (velké písmo, úzký displej). */
export function StatGrid({ items, style }: { items: StatItem[]; style?: StyleProp<ViewStyle> }) {
  const { c, space, radius } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }, style]}>
      {items.map((it) => (
        <View
          key={it.label}
          accessible
          accessibilityLabel={it.a11y ?? `${it.label}: ${it.value}`}
          style={{ flexGrow: 1, flexBasis: 0, minWidth: '40%', backgroundColor: c.surface, borderRadius: radius.l, padding: space.m, gap: space.xs }}
        >
          <Text variant="stat">{it.value}</Text>
          <Text variant="caption" tone="muted">{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
