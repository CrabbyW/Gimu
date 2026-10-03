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
 * Hlavička sezóny (Teplá litina §3.4): vlevo mono název sezóny a termín `caption muted`, vpravo `hero` počet dní
 * + `caption` „dní do konce“. Pod `layout.narrow` nebo při fontScale > `layout.fontScale` se skládá pod sebe:
 * název a termín nahoře, číslo pod nimi zarovnané vlevo (hero by jinak vytlačil název).
 */
export function SeasonHeader({ season, daysLeft }: Props) {
  const { space, seasonal } = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < layout.narrow || fontScale > layout.fontScale;
  return (
    <View
      style={{
        backgroundColor: seasonal.headerBase, paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.l,
        flexDirection: stacked ? 'column' : 'row', alignItems: stacked ? 'flex-start' : 'flex-end',
        justifyContent: 'space-between', gap: stacked ? space.m : space.l,
      }}
    >
      <View style={{ gap: space.xs, flexShrink: 1 }}>
        <Text variant="label" accessibilityRole="header">{season.name.toUpperCase()}</Text>
        <Text variant="caption" tone="muted">{copy.season.range(shortDate(season.startDate), shortDate(season.endDate))}</Text>
      </View>
      {daysLeft === null ? (
        <Text variant="bodyStrong">{copy.season.ended}</Text>
      ) : (
        <View accessible accessibilityLabel={copy.season.daysLeftA11y(daysLeft)} style={{ alignItems: stacked ? 'flex-start' : 'flex-end' }}>
          <Text variant="hero" tone="accent">{daysLeft}</Text>
          <Text variant="caption" tone="muted">{copy.season.daysLeftCaption}</Text>
        </View>
      )}
    </View>
  );
}
