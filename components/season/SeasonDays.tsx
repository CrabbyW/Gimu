import { View } from 'react-native';
import { Dot, DotGrid, type DotState } from '@/components/ui/DotGrid';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import type { DayState } from '@/services/contracts';
import { useTheme } from '@/theme';

const DOT_OF: Record<DayState, DotState> = { active: 'filled', repaired: 'soft', missed: 'outline', today: 'today', future: 'empty' };
const LEGEND: { state: DotState; label: string }[] = [
  { state: 'filled', label: copy.season.legend.active },
  { state: 'soft', label: copy.season.legend.repaired },
  { state: 'outline', label: copy.season.legend.missed },
  { state: 'today', label: copy.season.legend.today },
];

/** Všechny dny sezóny po týdnech (7 sloupců) a vpravo legenda: mřížka je souřadnicový systém sezóny,
 *  legenda ho popisuje (instrument vrstva), ne dekoruje. */
export function SeasonDays({ days }: { days: readonly { day: string; state: DayState }[] }) {
  const { space, size } = useTheme();
  const done = days.filter((d) => d.state === 'active' || d.state === 'repaired').length;
  return (
    <View style={{ gap: space.m }}>
      <Text variant="label" tone="muted">{copy.season.gridLabel}</Text>
      <View style={{ flexDirection: 'row', gap: space.xl, alignItems: 'flex-start' }}>
        <DotGrid
          cells={days.map((d) => ({ key: d.day, state: DOT_OF[d.state] }))}
          columns={7}
          accessibilityLabel={copy.season.gridA11y(done, days.length)}
        />
        <View style={{ gap: space.s, flexShrink: 1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {LEGEND.map((l) => (
            <View key={l.state} style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
              <Dot state={l.state} dot={size.dot} />
              <Text variant="telemetry" tone="muted">{l.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
