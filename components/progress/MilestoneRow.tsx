import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { intro, motion, useMotionSafe } from '@/lib/motion';
import { isMilestoneDone } from '@/logic/progress';
import { useTheme } from '@/theme';
import type { Milestone } from '@/types';

interface Props {
  milestone: Milestone; onPress(): void;
  /** Úvodní sled (motion): stopa se natáhne z 0 se zpožděním `delay`. */
  play?: boolean; delay?: number;
}

/** Řádek milníku (Teplá litina §3.3): název `body` vlevo, číslo `caption` tabulárně vpravo, progress bar
 *  (stopa `raised`, výplň `accentGraphic`). Binární milník = 0 / 1, žádná zvláštní větev vzhledu.
 *  Splněný: plná stopa a fajfka Check v `text`. */
export function MilestoneRow({ milestone: m, onPress, play = false, delay = 0 }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const done = isMilestoneDone(m);
  const ratio = m.target > 0 ? Math.min(1, Math.max(0, m.current / m.target)) : done ? 1 : 0;
  const isBinary = m.unit === 'done';
  // Motion: úvodní natažení stopy (520 ms ease-out), další změny (zapsaný pokrok) 260 ms. Omezený pohyb: hned.
  const { reduced } = useMotionSafe();
  const [intro0] = useState(play && !reduced);
  const w = useSharedValue(intro0 ? 0 : ratio);
  const mounted = useRef(false);
  useEffect(() => {
    if (reduced) { w.value = ratio; return; }
    w.value = !mounted.current && intro0
      ? withDelay(delay, withTiming(ratio, { duration: intro.bars.ms, easing: motion.reveal.easing }))
      : withTiming(ratio, motion.enter);
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratio, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.progress.milestoneA11y(m.label, m.current, m.target, done)}
      style={{ minHeight: size.hitLarge, justifyContent: 'center', paddingVertical: space.s, gap: space.s }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
        {done ? <Check size={size.icon} color={c.text} strokeWidth={stroke.icon} /> : null}
        <Text variant="body" style={{ flex: 1 }} numberOfLines={2}>{m.label}</Text>
        {/* Binární milník mluví stejnou gramatikou jako číselný: 0 / 1 → 1 / 1. */}
        <Text variant="caption" tone={done ? 'text' : 'muted'} style={{ fontVariant: ['tabular-nums'] }}>
          {copy.progress.milestoneValue(isBinary ? Math.min(m.current, 1) : m.current, isBinary ? 1 : m.target)}
        </Text>
      </View>
      <View style={{ height: size.meter, borderRadius: radius.full, backgroundColor: c.raised, overflow: 'hidden' }}>
        <Animated.View style={[fill, { height: '100%', borderRadius: radius.full, backgroundColor: c.accentGraphic }]} />
      </View>
    </Pressable>
  );
}
