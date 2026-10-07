import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme, tabularNums } from '@/theme';
import { Text } from './Text';

interface Props {
  /** Nadpis sekce; verzálky dělá token `label` (mono, rozpal 0.18 em). */
  children: string;
  /** Volitelný údaj vpravo, např. „3 / 12“ (tabulárně, `caption muted`). */
  value?: string;
  style?: StyleProp<ViewStyle>;
}

/** Mono nadpis sekce (Teplá litina §2.4): jediné místo, kde appka mluví monospace. */
export function SectionLabel({ children, value, style }: Props) {
  const { space } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: space.m }, style]}>
      <Text variant="label" tone="muted" accessibilityRole="header" style={{ flexShrink: 1 }}>{children}</Text>
      {value !== undefined ? <Text variant="caption" tone="muted" style={tabularNums}>{value}</Text> : null}
    </View>
  );
}
