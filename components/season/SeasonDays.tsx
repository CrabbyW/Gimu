import { View } from 'react-native';
import { DotGrid, type DotState } from '@/components/ui/DotGrid';
import { DayLegend } from '@/components/ui/DayLegend';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { copy } from '@/data/copy';
import type { DayState } from '@/services/contracts';
import { useTheme } from '@/theme';

const DOT_OF: Record<DayState, DotState> = { active: 'filled', repaired: 'soft', missed: 'outline', today: 'today', future: 'empty' };

/** Dny sezóny po týdnech (7 sloupců) a pod nimi legenda 2 × 2 přes celou šířku (Teplá litina §3.4).
 *  Legenda pod mřížkou, ne vedle: vedle se na 320 pt a při velkém písmu ořezávala. Rozlišení tvarem, ne barvou. */
export function SeasonDays({ days }: { days: readonly { day: string; state: DayState }[] }) {
  const { space } = useTheme();
  const done = days.filter((d) => d.state === 'active' || d.state === 'repaired').length;
  return (
    <View style={{ gap: space.m }}>
      <SectionLabel>{copy.season.gridLabel}</SectionLabel>
      <DotGrid
        cells={days.map((d) => ({ key: d.day, state: DOT_OF[d.state] }))}
        columns={7}
        accessibilityLabel={copy.season.gridA11y(done, days.length)}
      />
      <DayLegend />
    </View>
  );
}
