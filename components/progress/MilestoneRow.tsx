import { Check } from 'lucide-react-native';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { DotRow } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { isMilestoneDone } from '@/logic/progress';
import { useTheme } from '@/theme';
import type { Milestone } from '@/types';

interface Props {
  milestone: Milestone; onPress(): void;
  /** Úvodní sled (motion): sken teček se zpožděním `delay`. */
  play?: boolean; delay?: number;
  style?: StyleProp<ViewStyle>;
}

/** Teček v řádku pokroku: jedna tečka = 10 % cíle (čte se na první pohled, nezávisle na jednotce). */
const STEPS = 10;
/** Dva řádky po 5 (5 × 16 − 6 = 74 pt): vejde se do poloviční dlaždice i na 360 pt (vnitřek ≈ 108 pt). */
const STEP_COLS = 5;

/**
 * Milník jako dlaždice (Nothing Dot fáze 2): nahoře řádek 10 teček pokroku, dole název `headline` a mono
 * „12 / 20“. Splněný: všechny tečky + fajfka. Binární milník = 0 / 1 (stejná gramatika jako číselný).
 * Celá dlaždice je tlačítko (zápis pokroku), 1 plátno.
 */
export function MilestoneRow({ milestone: m, onPress, play = false, delay = 0, style }: Props) {
  const { c, space, size, stroke } = useTheme();
  const done = isMilestoneDone(m);
  const isBinary = m.unit === 'done';
  const target = isBinary ? 1 : m.target;
  const current = isBinary ? Math.min(m.current, 1) : m.current;
  const ratio = done ? 1 : target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
  return (
    <Tile
      onPress={onPress}
      accessibilityLabel={copy.progress.milestoneA11y(m.label, m.current, m.target, done)}
      style={[{ flex: 1, gap: space.m, justifyContent: 'space-between', minHeight: size.heroTile }, style]}
    >
      <DotRow total={STEPS} fraction={ratio} columns={STEP_COLS} intro={play ? delay : false} />
      <View style={{ gap: space.xs }}>
        <Text variant="headline" numberOfLines={2}>{m.label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
          {done ? <Check size={size.badgeIcon} color={c.text} strokeWidth={stroke.icon} /> : null}
          <Text variant="label" tone={done ? 'text' : 'muted'}>{copy.progress.milestoneValue(current, target)}</Text>
        </View>
      </View>
    </Tile>
  );
}
