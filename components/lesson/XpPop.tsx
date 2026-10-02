import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { motion } from '@/lib/motion';
import { useTheme } from '@/theme';

// Count-up (UX2): expo.out, čísla naskočí a dojedou. Slam z 1.2 na pružině `motion.slam` (ζ ≈ 0.8).
const COUNT_MS = motion.countMs;
const SLAM_FROM = 1.2;
const easeOut = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

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
  const scale = useSharedValue(calm ? 1 : SLAM_FROM);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!shown) return;
    if (calm) { opacity.set(withTiming(1, motion.calmFade)); return; }
    // Akcent se nezprůhledňuje (nový odstín): číslo se objeví naráz a vstup nese slam scale.
    opacity.set(1);
    scale.set(withSpring(1, motion.slam));
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
