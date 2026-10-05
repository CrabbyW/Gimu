import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { DotField } from '@/components/dots';
import { Reveal } from '@/components/ui/choreo';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
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

const { step, rise } = intro.card;
// ~62 znaků Interu 16 pt (průměrná šířka znaku ≈ 8 pt): pohodlná délka řádku na tabletu.
const MEASURE = 496;

interface Props { exercise: Exercise; /** Jen u výdrže. */ timer?: HoldTimerState }

/** Karta cviku (Nothing Dot §6): panel = dlaždice se siluetou stojící na „podlaze“ z teček (pole doznívá
 *  nahoru k horizontu), pod ním JEDNO velké Doto číslo (opakování, u výdrže tečkový odpočet) — to má
 *  cvičenec v hlavě —, pak název a popis techniky. Silueta zůstává beze změny (subjekt, ne ozdoba). */
export function ExerciseCard({ exercise, timer }: Props) {
  const { space, size } = useTheme();
  return (
    <Animated.View entering={enter} exiting={exit} style={{ gap: space.l }}>
      <Tile pad="none" style={{ height: size.silhouettePanel }}>
        {/* Podlaha se prolne první (zem dřív než postava), pak silueta. */}
        <Reveal play delay={intro.floor.at} rise={intro.floor.rise} config={motion.reveal} style={StyleSheet.absoluteFill}><Floor /></Reveal>
        {/* Vnitřní sled karty (motion): panel přijede s kartou, silueta v něm se zvedne o úder později,
            pak číslo, název a popis po 50 ms. Celý sled ≤ 260 + 200 ms. */}
        <Reveal play delay={step} rise={rise} style={{ flex: 1, padding: space.m }}><ExerciseSilhouette id={exercise.silhouette} /></Reveal>
      </Tile>
      <View style={{ gap: space.s }}>
        <Reveal play delay={step * 2} rise={rise}>
          {exercise.type === 'hold' && timer
            ? <HoldTimer timer={timer} total={exercise.amount} />
            : <Stat size="L" value={exercise.amount} unit={copy.lesson.reps} />}
        </Reveal>
        <Reveal play delay={step * 3} rise={rise}><Text variant="title" accessibilityRole="header">{exercise.name}</Text></Reveal>
        <Reveal play delay={step * 4} rise={rise}><Text variant="body" tone="muted" style={{ maxWidth: MEASURE }}>{exercise.description}</Text></Reveal>
      </View>
    </Animated.View>
  );
}

/** Podlaha z teček: pole `dotOff` doznívající nahoru (u spodní hrany plné, k horizontu mizí). Dekorativní, bez dotyku. */
function Floor() {
  const [box, setBox] = useState({ w: 0, h: 0 });
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={StyleSheet.absoluteFill}
    >
      {box.w > 0 ? <DotField width={box.w} height={box.h} fade="up" /> : null}
    </View>
  );
}
