import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
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

/** Chip milníku: nevybraný na ploše `surface`, vybraný inverzní (pozadí `text`, písmo `base`).
 *  Motion (UX2): inverze se prolne (vrstva `text` + kopie popisku v `base`, `motion.ui`/`uiExit`), stisk 0.96. */
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
  const feedback = usePressFeedback(0.96);
  const sel = useSelectionProgress(selected);
  const inverse = useAnimatedStyle(() => ({ opacity: sel.value }));

  return (
    <Animated.View style={[shake, feedback.style]}>
      <Pressable
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
        style={({ pressed }) => ({
          minHeight: size.hit, justifyContent: 'center', paddingHorizontal: space.m, borderRadius: radius.full,
          backgroundColor: pressed && !selected ? c.raised : c.surface, overflow: 'hidden',
        })}
      >
        <Text variant="bodyStrong">{label}</Text>
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          aria-hidden
          style={[inverse, { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: space.m, backgroundColor: c.text }]}
        >
          <Text variant="bodyStrong" style={{ color: c.base }}>{label}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}
