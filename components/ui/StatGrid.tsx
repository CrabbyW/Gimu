import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { Tile } from './Tile';

export interface StatItem {
  /** Číslo (Doto `dotStat`), např. „1 240“. Nuly se neschovávají. */
  value: string;
  /** Malá jednotka vedle čísla (`headline muted`), např. „XP“, „/ 3“. */
  unit?: string;
  /** Název dlaždice vlevo dole (Inter, sentence case). */
  label: string;
  /** Hlasitý popis, když hodnota sama nestačí. */
  a11y?: string;
}

/**
 * Statistiky jako dlaždice (Nothing Dot fáze 2, obr. 2): číslo Doto `dotStat` + malá jednotka vlevo nahoře,
 * název vlevo dole. `cols` 2 = mřížka 2×N, 1 = pod sebou (úzký displej / velké písmo, `tileColumns`).
 * Lichá poslední dlaždice ve dvou sloupcích drží poloviční šířku.
 */
export function StatGrid({ items, cols = 2, style }: { items: StatItem[]; cols?: 1 | 2; style?: StyleProp<ViewStyle> }) {
  const { space } = useTheme();
  const rows: StatItem[][] = [];
  for (let i = 0; i < items.length; i += cols) rows.push(items.slice(i, i + cols));
  return (
    <View style={[{ gap: space.m }, style]}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: space.m }}>
          {row.map((it) => <StatTile key={it.label} item={it} />)}
          {row.length < cols ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}

function StatTile({ item }: { item: StatItem }) {
  const { space } = useTheme();
  return (
    <View style={{ flex: 1, minWidth: 0 }} accessible accessibilityLabel={item.a11y ?? `${item.label}: ${item.value}${item.unit ? ` ${item.unit}` : ''}`}>
      <Tile style={{ flex: 1, gap: space.l, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: space.s }}>
          <Text variant="dotStat" numberOfLines={1}>{item.value}</Text>
          {item.unit ? <Text variant="headline" tone="muted">{item.unit}</Text> : null}
        </View>
        <Text variant="caption" tone="muted" numberOfLines={2}>{item.label}</Text>
      </Tile>
    </View>
  );
}
