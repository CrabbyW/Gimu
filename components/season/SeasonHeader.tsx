import { StyleSheet, View } from 'react-native';
import { Stat } from '@/components/ui/Stat';
import { Telemetry } from '@/components/ui/Telemetry';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import type { Season } from '@/types';
import { shortDate } from './format';

interface Props {
  season: Season;
  /** Dny do konce včetně dneška; `null` = sezóna skončila. */
  daysLeft: number | null;
}

/**
 * Hlavička sezóny (§7.7) v sezónním neutrálu `seasonal.headerBase`: název sezóny jako display řádek,
 * rozsah dat v telemetrii, vpravo dole obří odpočet dní. Odpočet je jediné velké číslo hlavičky;
 * progres cíle pod ní má vlastní, větší Stat, takže hlavička ho nepřehluší (L proti XL).
 */
export function SeasonHeader({ season, daysLeft }: Props) {
  const { c, space, seasonal } = useTheme();
  return (
    <View
      style={{
        backgroundColor: seasonal.headerBase, paddingHorizontal: space.l, paddingTop: space.xl, paddingBottom: space.l, gap: space.l,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule,
      }}
    >
      <View style={{ gap: space.s }}>
        <Text variant="display" accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>{season.name.toUpperCase()}</Text>
        <Telemetry items={[{ key: copy.tabs.season.toUpperCase(), value: copy.season.range(shortDate(season.startDate), shortDate(season.endDate)) }]} />
      </View>
      {daysLeft === null ? (
        <Text variant="bodyStrong">{copy.season.ended}</Text>
      ) : (
        <View accessible accessibilityLabel={copy.season.daysLeftA11y(daysLeft)}>
          <Stat label={copy.season.daysLeftLabel} value={daysLeft} unit={copy.season.daysLeftUnit} size="M" />
        </View>
      )}
    </View>
  );
}
