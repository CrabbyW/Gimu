import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useTheme, tabularNums } from '@/theme';
import type { ISODate } from '@/types';
import { shortDate } from './format';

interface Props { repairWindow: readonly ISODate[]; reachable: boolean }

/**
 * Comeback (Nothing Dot fáze 2): dlaždice „co jde dohnat a dokdy“. Tón je výzva, nikdy prohra. Okno dní
 * jako mono řádek se skutečnými daty („OKNO 3. 10. · 4. 10.“), ať je jasné, které dny druhá lekce opraví.
 */
export function ComebackCard({ repairWindow, reachable }: Props) {
  const { space } = useTheme();
  const n = repairWindow.length;
  return (
    <Tile style={{ gap: space.s }}>
      <Text variant="headline" accessibilityRole="header">{copy.season.comebackTitle}</Text>
      <Text variant="body" tone="muted" style={tabularNums}>{n > 0 ? copy.season.comebackBody(n) : copy.season.comebackEmpty}</Text>
      {n > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.s, marginTop: space.xs }}>
          <Text variant="label" tone="muted">{copy.season.comebackWindow}</Text>
          <Text variant="label">{repairWindow.map(shortDate).join(' · ')}</Text>
        </View>
      ) : null}
      {!reachable ? <Text variant="body" style={{ marginTop: space.s }}>{copy.season.unreachable}</Text> : null}
    </Tile>
  );
}
