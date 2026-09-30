import { View } from 'react-native';
import Animated, { withTiming, type EntryExitAnimationFunction } from 'react-native-reanimated';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { Exercise } from '@/types';
import { ExerciseSilhouette } from './ExerciseSilhouette';
import { HoldTimer } from './HoldTimer';
import type { HoldTimer as HoldTimerState } from './useHoldTimer';

// Nová karta přijede zprava s dozvukem (reveal), stará rychle zmizí (uiExit).
const enter: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateX: 24 }] },
    animations: { opacity: withTiming(1, motion.reveal), transform: [{ translateX: withTiming(0, motion.reveal) }] },
  };
};
const exit: EntryExitAnimationFunction = () => {
  'worklet';
  return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, motion.uiExit) } };
};

const SILHOUETTE_HEIGHT = 200;
// ~62 znaků Interu 16 pt (průměrná šířka znaku ≈ 8 pt): pohodlná délka řádku na tabletu.
const MEASURE = 496;

interface Props { exercise: Exercise; /** Jen u výdrže. */ timer?: HoldTimerState }

/** Karta cviku: silueta, název, množství (u výdrže odpočet) a popis techniky. */
export function ExerciseCard({ exercise, timer }: Props) {
  const { c, radius, space } = useTheme();
  return (
    <Animated.View entering={enter} exiting={exit} style={{ gap: space.m }}>
      <View style={{ height: SILHOUETTE_HEIGHT, backgroundColor: c.surface, borderRadius: radius.l, padding: space.m }}>
        <ExerciseSilhouette id={exercise.silhouette} />
      </View>
      <Text variant="display" accessibilityRole="header">{exercise.name}</Text>
      {exercise.type === 'hold' && timer
        ? <HoldTimer timer={timer} />
        : <Stat size="L" value={exercise.amount} unit={copy.lesson.reps} />}
      <Text variant="body" tone="muted" style={{ maxWidth: MEASURE }}>{exercise.description}</Text>
    </Animated.View>
  );
}
