import { View } from 'react-native';
import { DayLegend } from '@/components/ui/DayLegend';
import { DotGrid, type DotState } from '@/components/ui/DotGrid';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import type { DayState } from '@/services/contracts';
import { dots, useTheme } from '@/theme';

const DOT_OF: Record<DayState, DotState> = { active: 'filled', repaired: 'soft', missed: 'outline', today: 'today', future: 'empty' };

/**
 * Dny sezóny (Nothing Dot fáze 2): dlaždice s tečkovou řadou dní, 14 na řádek (= 2 týdny, 90 dní ≤ 7 řádků),
 * tečka 10 a mezera 6 podle spec §6.4. Vpravo nahoře mono součet „31 / 90“, pod řadou legenda 2 × 2.
 * Tečky z RN View, ne Skia: pět stavů dne (DotRow umí jen rozsvíceno / zhasnuto) a žádné plátno navíc.
 */
export function SeasonDays({ days }: { days: readonly { day: string; state: DayState }[] }) {
  const { space } = useTheme();
  const done = days.filter((d) => d.state === 'active' || d.state === 'repaired').length;
  return (
    <Tile style={{ gap: space.m }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.m }}>
        <Text variant="label" tone="muted" accessibilityRole="header">{copy.season.gridLabel}</Text>
        <Text variant="label">{copy.season.gridTally(done, days.length)}</Text>
      </View>
      <DotGrid
        cells={days.map((d) => ({ key: d.day, state: DOT_OF[d.state] }))}
        columns={dots.season.perRow}
        size={dots.season.d}
        accessibilityLabel={copy.season.gridA11y(done, days.length)}
      />
      <DayLegend />
    </Tile>
  );
}
