import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { motion } from '@/lib/motion';
import { useTheme } from '@/theme';

const COUNT_MS = 500;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

interface Props {
  total: number;
  /** Rozpis „lekce 20 · první dnes +10“ (velká písmena dělá styl label). */
  breakdown: string;
  /** Okamžik vyskočení; do té doby je místo rezervované a prázdné. */
  shown: boolean;
  /** Omezený pohyb: jen prolnutí, číslo rovnou konečné. */
  calm: boolean;
}

/** +XP v oslavě: obří akcentové číslo s count-up, pod ním rozpis. Je to subjekt obrazovky. */
export function XpPop({ total, breakdown, shown, calm }: Props) {
  const { space } = useTheme();
  const [count, setCount] = useState(calm ? total : 0);
  const scale = useSharedValue(calm ? 1 : 0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!shown) return;
    if (calm) { opacity.set(withTiming(1, { duration: 200 })); return; }
    opacity.set(withTiming(1, motion.ui));
    scale.set(withSpring(1, motion.pop));
    let frame = 0;
    let start: number | null = null;
    const tick = (t: number) => {
      start ??= t;
      const p = Math.min(1, (t - start) / COUNT_MS);
      setCount(Math.round(easeOut(p) * total));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, calm, total, opacity, scale]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[{ transformOrigin: 'left bottom' }, style]} accessible accessibilityElementsHidden={!shown} importantForAccessibility={shown ? 'yes' : 'no-hide-descendants'} accessibilityLabel={`+${total} XP, ${breakdown}`}>
      <Stat size="XL" value={`+${count}`} unit="XP" tone="accent" />
      <View style={{ marginTop: space.s }}>
        <Text variant="label" tone="muted">{breakdown}</Text>
      </View>
    </Animated.View>
  );
}
