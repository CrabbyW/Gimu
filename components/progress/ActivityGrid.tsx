import { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, intro, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { GridCell } from '@/logic/progress';

interface Props {
  cells: GridCell[];
  /** Úvodní sled (motion): buňky se vyplní po dnech od nejstaršího. */
  play?: boolean;
}

const COLS = 7;

/** Mřížka aktivity 5 × 7 (po–ne). Aktivní = plná `text`, prázdný = obrys `rule`, budoucí = jen tlumená plocha,
 *  dnes = obrys `text` 2 pt (R42: akcent patří oslavě, dnešek nese kontrast a tvar). */
export function ActivityGrid({ cells, play = false }: Props) {
  const { c, space, radius, stroke } = useTheme();
  const [width, setWidth] = useState(0);
  const gap = space.xs;
  const cell = width > 0 ? Math.floor((width - gap * (COLS - 1)) / COLS) : 0;
  const active = cells.filter((x) => x.state === 'active').length;

  return (
    <View accessible accessibilityLabel={copy.progress.gridA11y(active)} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ gap }}>
      <View style={{ flexDirection: 'row', gap }}>
        {copy.progress.weekdays.map((d) => (
          <Text key={d} variant="badgeLabel" tone="muted" style={{ width: cell || undefined, flex: cell ? undefined : 1, textAlign: 'center' }}>{d}</Text>
        ))}
      </View>
      {cell > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
          {cells.map((x, i) => (
            <Cell
              key={x.day}
              play={play}
              delay={intro.grid.at + i * intro.grid.step}
              style={{
                width: cell, height: cell, borderRadius: radius.s,
                backgroundColor: x.state === 'active' ? c.text : x.state === 'future' ? c.surface : 'transparent',
                borderWidth: x.state === 'today' ? stroke.focus : x.state === 'empty' ? 1 : 0,
                borderColor: x.state === 'today' ? c.text : c.rule,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Buňka dne: při úvodním sledu se „vyplní“ (opacita 0 → 1, scale 0.6 → 1, 180 ms ease-out), den po dni
 *  po 12 ms (35 buněk ≈ 420 ms). Timing, ne pružina: je to záznam, ne fyzický předmět. Omezený pohyb: stojí. */
function Cell({ play, delay, style }: { play: boolean; delay: number; style: ViewStyle }) {
  const { reduced } = useMotionSafe();
  const [animate] = useState(play && !reduced);
  const t = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) t.value = withDelay(delay, withTiming(1, { duration: intro.grid.cellMs, easing: ease.out }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const a = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.6 + 0.4 * t.value }] }));
  return <Animated.View style={[style, a]} />;
}
