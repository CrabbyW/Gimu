import { View } from 'react-native';
import { Mascot } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useTheme, tabularNums } from '@/theme';
import type { CosmeticSlot, ISODate, MascotStage } from '@/types';
import { shortDate } from './format';

interface Props {
  repairWindow: readonly ISODate[];
  reachable: boolean;
  stage?: MascotStage;
  cosmetics?: Partial<Record<CosmeticSlot, string>>;
}

const NO_COSMETICS = {} as const;

/**
 * Comeback (Nothing Dot fáze 2): dlaždice „co jde dohnat a dokdy“. Tón je výzva, nikdy prohra. Okno dní
 * jako mono řádek se skutečnými daty („OKNO 3. 10. · 4. 10.“), ať je jasné, které dny druhá lekce opraví.
 */
export function ComebackCard({ repairWindow, reachable, stage = 1, cosmetics = NO_COSMETICS }: Props) {
  const { space, size } = useTheme();
  const n = repairWindow.length;
  return (
    <Tile style={{ gap: space.s }}>
      {/* UX pass U5: přerušená série = smutná opička vedle titulku (jediná barva), text pod ní v plné šíři,
          ať se na 320 pt nezúží do sloupce. Titulek zůstává nejsilnější (výzva), opička doprovází. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
        <Text variant="headline" accessibilityRole="header" style={{ flex: 1 }}>{copy.season.comebackTitle}</Text>
        <Mascot stage={stage} mood="sad" size={size.heroMascot} cosmetics={cosmetics} decorative hop={false} />
      </View>
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
