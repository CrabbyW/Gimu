import { View, type StyleProp, type ViewStyle } from 'react-native';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { Text } from './Text';

export type DayMark = 'done' | 'caught' | 'missed' | 'today';

const ORDER: DayMark[] = ['done', 'caught', 'missed', 'today'];

/** Tečka dne v jazyce DotGridu: rozlišení tvarem, ne barvou (Teplá litina §3.4).
 *  done = plná `text`, caught = plná s vnitřním prstencem `base`, missed = obrys `faint`, today = prstenec `accentGraphic`. */
export function DayDot({ mark }: { mark: DayMark }) {
  const { c, size, radius, stroke } = useTheme();
  const d = size.dot;
  const filled = mark === 'done' || mark === 'caught';
  return (
    <View
      style={{
        width: d, height: d, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
        backgroundColor: filled ? c.text : 'transparent',
        borderWidth: filled ? 0 : stroke.icon,
        borderColor: mark === 'today' ? c.accentGraphic : c.faint,
      }}
    >
      {mark === 'caught' ? (
        <View style={{ width: d / 2, height: d / 2, borderRadius: radius.full, borderWidth: stroke.slot, borderColor: c.base }} />
      ) : null}
    </View>
  );
}

/** Legenda 2 × 2 pod mřížkou dnů. */
export function DayLegend({ marks = ORDER, style }: { marks?: DayMark[]; style?: StyleProp<ViewStyle> }) {
  const { space } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', rowGap: space.s }, style]}>
      {marks.map((m) => (
        <View key={m} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          <DayDot mark={m} />
          <Text variant="caption" tone="muted">{copy.legend[m]}</Text>
        </View>
      ))}
    </View>
  );
}
