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

/** Řádek milníku: název, hodnota `12 / 15` (tabulární) a měřicí stopa 4 pt (`rule` → výplň `text`).
 *  Splněný (R42 bez akcentu): plná stopa, ikona Check a štítek „Splněno.“ — stav nese tvar, ne barva. */
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
        <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>{m.label}</Text>
        <Text variant="label" tone={done ? 'text' : 'muted'}>
          {done ? copy.progress.milestoneDone : isBinary ? '' : copy.progress.milestoneValue(m.current, m.target)}
        </Text>
      </View>
      <View style={{ height: size.meter, borderRadius: radius.full, backgroundColor: c.rule, overflow: 'hidden' }}>
        <Animated.View style={[fill, { height: '100%', backgroundColor: c.text }]} />
      </View>
    </Pressable>
  );
}
