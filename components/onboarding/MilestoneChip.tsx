import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';

interface Props {
  label: string;
  selected: boolean;
  onPress(): void;
  /** Počítadlo odmítnutí: každá změna na nenulovou hodnotu chip krátce zatřese. */
  shakeSignal: number;
}

const SHAKE_PX = 4;
const SHAKE_STEP = { duration: 50, easing: motion.ui.easing };

/** Chip milníku: nevybraný na ploše `surface`, vybraný inverzní (pozadí `text`, písmo `base`). */
export function MilestoneChip({ label, selected, onPress, shakeSignal }: Props) {
  const { c, space, radius, size } = useTheme();
  const { reduced } = useMotionSafe();
  const x = useSharedValue(0);

  // Zatřesení je UI zpětná vazba (ne odměna), proto timing, ne pružina. S omezeným pohybem se vynechá.
  useEffect(() => {
    if (shakeSignal === 0 || reduced) return;
    x.value = withSequence(
      withTiming(SHAKE_PX, SHAKE_STEP), withTiming(-SHAKE_PX, SHAKE_STEP),
      withTiming(SHAKE_PX, SHAKE_STEP), withTiming(0, SHAKE_STEP),
    );
  }, [shakeSignal, reduced, x]);
  const shake = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View style={shake}>
      <Pressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
        style={({ pressed }) => ({
          minHeight: size.hit, justifyContent: 'center', paddingHorizontal: space.m, borderRadius: radius.full,
          backgroundColor: selected ? c.text : pressed ? c.raised : c.surface,
        })}
      >
        <Text variant="bodyStrong" style={selected ? { color: c.base } : undefined}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
