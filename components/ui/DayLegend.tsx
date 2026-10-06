import { View, type StyleProp, type ViewStyle } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Dot, type DotState } from './DotGrid';
import { Text } from './Text';

export type DayMark = 'done' | 'caught' | 'missed' | 'today';

const ORDER: DayMark[] = ['done', 'caught', 'missed', 'today'];

const STATE_OF: Record<DayMark, DotState> = { done: 'filled', caught: 'soft', missed: 'outline', today: 'today' };

/** Tečka dne: přesně tatáž kresba jako v `DotGrid` (legenda nesmí mluvit jiným jazykem než mřížka). */
export function DayDot({ mark }: { mark: DayMark }) {
  const { size } = useTheme();
  return <Dot state={STATE_OF[mark]} dot={size.dot} />;
}

/** Legenda 2 × 2 pod mřížkou dnů: tečka + mono štítek. */
export function DayLegend({ marks = ORDER, style }: { marks?: DayMark[]; style?: StyleProp<ViewStyle> }) {
  const { space } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.s }, style]}>
      {marks.map((m) => (
        <View key={m} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <DayDot mark={m} />
          <Text variant="label" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>{copy.legend[m]}</Text>
        </View>
      ))}
    </View>
  );
}
