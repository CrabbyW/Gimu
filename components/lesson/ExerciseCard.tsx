import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { Exercise } from '@/types';
import { ExerciseSilhouette } from './ExerciseSilhouette';
import { HoldTimer } from './HoldTimer';
import type { HoldTimer as HoldTimerState } from './useHoldTimer';

// UX2 výměna cviku (hyperframes: odchod a příchod běží současně, pohyb je předávka):
// nová karta přijede zprava o 32 pt punch křivkou (`motion.enter`, 260 ms), stará odjede
// doleva a zmizí (`motion.uiExit`, 150 ms). S omezeným pohybem jen prolnutí (reanimated ReduceMotion).
const enter = FadeInRight.duration(motion.enter.duration).easing(motion.enter.easing)
  .withInitialValues({ opacity: 0, transform: [{ translateX: 32 }] });
const exit = FadeOutLeft.duration(motion.uiExit.duration).easing(motion.uiExit.easing);

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
