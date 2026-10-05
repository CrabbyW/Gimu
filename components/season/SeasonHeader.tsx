import { View, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { layout, useTheme } from '@/theme';
import type { Season } from '@/types';
import { shortDate } from './format';

interface Props {
  season: Season;
  /** Dny do konce včetně dneška; `null` = sezóna skončila. */
  daysLeft: number | null;
}

/**
 * Hlavička sezóny (Teplá litina §3.4; hloubka a materiál 2026-10-03): nahoře mono název sezóny a termín
 * `caption muted`, pod nimi odpočet jako hero obrazovky: číslo `displayXL` (pod `layout.narrow` `hero`)
 * v `accentText` a vedle na účaří `headline muted` „dní do konce“. Vždy pod sebou, takže velké písmo nic nevytlačí.
 */
export function SeasonHeader({ season, daysLeft }: Props) {
  const { space, seasonal } = useTheme();
  const { width } = useWindowDimensions();
  // Hero odpočtu: `displayXL` (110) jen tam, kde se třímístné číslo vejde vedle popisku; na úzkém displeji `hero` (64).
  const big = width >= layout.narrow;
  return (
    <View style={{ backgroundColor: seasonal.headerBase, paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.l, gap: space.m }}>
      <View style={{ gap: space.xs }}>
        <Text variant="label" accessibilityRole="header">{season.name.toUpperCase()}</Text>
        <Text variant="caption" tone="muted">{copy.season.range(shortDate(season.startDate), shortDate(season.endDate))}</Text>
      </View>
      {daysLeft === null ? (
        <Text variant="title">{copy.season.ended}</Text>
      ) : (
        <View
          accessible
          accessibilityLabel={copy.season.daysLeftA11y(daysLeft)}
          style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', columnGap: space.m }}
        >
          <Text variant={big ? 'displayXL' : 'hero'} tone="accent">{daysLeft}</Text>
          <Text variant="headline" tone="muted" style={{ paddingBottom: space.m }}>{copy.season.daysLeftCaption}</Text>
        </View>
      )}
    </View>
  );
}
