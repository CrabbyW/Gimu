import { View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { Reveal } from '@/components/ui/choreo';
import { RegMark } from '@/components/ui/RegMark';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { intro, motion } from '@/lib/motion';
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
const { step, rise } = intro.card;
// ~62 znaků Interu 16 pt (průměrná šířka znaku ≈ 8 pt): pohodlná délka řádku na tabletu.
const MEASURE = 496;

interface Props { exercise: Exercise; /** Jen u výdrže. */ timer?: HoldTimerState }

/** Karta cviku (hero, R42): panel siluety s registračními značkami, pod ním název v display řezu,
 *  množství (u výdrže odpočet) a popis techniky. Vše zarovnané vlevo; mezi blokem siluety a textem
 *  větší mezera (space.xl), aby silueta stála jako subjekt a text jako popiska. */
export function ExerciseCard({ exercise, timer }: Props) {
  const { c, radius, space } = useTheme();
  return (
    <Animated.View entering={enter} exiting={exit} style={{ gap: space.xl }}>
      <RegMark>
        <View style={{ height: SILHOUETTE_HEIGHT, backgroundColor: c.surface, borderRadius: radius.l, padding: space.m }}>
          {/* Vnitřní sled karty (motion): panel přijede s kartou, silueta v něm se zvedne o úder později,
              pak název, množství a popis po 50 ms. Celý sled ≤ 260 + 200 ms. */}
          <Reveal play delay={step} rise={rise} style={{ flex: 1 }}><ExerciseSilhouette id={exercise.silhouette} /></Reveal>
        </View>
      </RegMark>
      <View style={{ gap: space.m }}>
        <Reveal play delay={step * 2} rise={rise}><Text variant="display" accessibilityRole="header">{exercise.name}</Text></Reveal>
        <Reveal play delay={step * 3} rise={rise}>
          {exercise.type === 'hold' && timer
            ? <HoldTimer timer={timer} />
            : <Stat size="L" value={exercise.amount} unit={copy.lesson.reps} />}
        </Reveal>
        <Reveal play delay={step * 4} rise={rise}><Text variant="body" tone="muted" style={{ maxWidth: MEASURE }}>{exercise.description}</Text></Reveal>
      </View>
    </Animated.View>
  );
}
