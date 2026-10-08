import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight, FadeOut, FadeOutLeft, ReduceMotion } from 'react-native-reanimated';
import { DotField } from '@/components/dots';
import { Reveal } from '@/components/ui/choreo';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { intro, motion, useMotionSafe } from '@/lib/motion';
import { useShort, useTheme } from '@/theme';
import type { Exercise } from '@/types';
import { ExerciseSilhouette } from './ExerciseSilhouette';
import { HoldTimer } from './HoldTimer';
import type { HoldTimer as HoldTimerState } from './useHoldTimer';

// UX2 výměna cviku (hyperframes: odchod a příchod běží současně, pohyb je předávka):
// nová karta přijede zprava o 32 pt punch křivkou (`motion.enter`, 260 ms), stará odjede
// doleva a zmizí (`motion.uiExit`, 150 ms). S omezeným pohybem jen prolnutí bez posunu (`calmEnter`/`calmExit`;
// výchozí ReduceMotion.System by layout animaci vypnul a karta by se vyměnila skokem).
const enter = FadeInRight.duration(motion.enter.duration).easing(motion.enter.easing)
  .withInitialValues({ opacity: 0, transform: [{ translateX: 32 }] });
const exit = FadeOutLeft.duration(motion.uiExit.duration).easing(motion.uiExit.easing);
const calmEnter = FadeIn.duration(motion.calmFade.duration).reduceMotion(ReduceMotion.Never);
const calmExit = FadeOut.duration(motion.uiExit.duration).reduceMotion(ReduceMotion.Never);

const { step, rise } = intro.card;
// ~62 znaků Interu 16 pt (průměrná šířka znaku ≈ 8 pt): pohodlná délka řádku na tabletu.
const MEASURE = 496;

interface Props {
  exercise: Exercise; /** Jen u výdrže. */ timer?: HoldTimerState;
  /** Pod popisem je bublina průvodce (v obsahu scrollu): menší panel siluety, aby se bublina vešla nad lištu bez scrollu. */
  guided?: boolean;
}

/** Karta cviku (Nothing Dot §6): panel = dlaždice se siluetou stojící na „podlaze“ z teček (pole doznívá
 *  nahoru k horizontu), pod ním JEDNO velké Doto číslo (opakování, u výdrže tečkový odpočet) — to má
 *  cvičenec v hlavě —, pak název a popis techniky. Silueta zůstává beze změny (subjekt, ne ozdoba). */
export function ExerciseCard({ exercise, timer, guided = false }: Props) {
  const { c, space, size, radius } = useTheme();
  // Nízký displej (320×568): menší panel, menší číslo a těsnější mezery — vše nad lištou bez scrollu.
  const short = useShort();
  const { reduced } = useMotionSafe();
  return (
    <Animated.View entering={reduced ? calmEnter : enter} exiting={reduced ? calmExit : exit} style={{ gap: short ? space.m : space.l }}>
      <Tile pad="none" style={{ height: guided ? (short ? size.silhouettePanelGuide : size.silhouettePanelShort) : (short ? size.silhouettePanelShort : size.silhouettePanel) }}>
        {/* Podlaha se prolne první (zem dřív než postava), pak silueta. */}
        <Reveal play delay={intro.floor.at} rise={intro.floor.rise} config={motion.reveal} style={StyleSheet.absoluteFill}><Floor /></Reveal>
        {/* Vnitřní sled karty (motion): panel přijede s kartou, silueta v něm se zvedne o úder později,
            pak číslo, název a popis po 50 ms. Celý sled ≤ 260 + 200 ms. */}
        <Reveal play delay={step} rise={rise} style={{ flex: 1, padding: short ? space.s : space.m }}><ExerciseSilhouette id={exercise.silhouette} /></Reveal>
      </Tile>
      <View style={{ gap: short ? space.xs : space.s }}>
        <Reveal play delay={step * 2} rise={rise}>
          {exercise.type === 'hold' && timer
            ? <HoldTimer timer={timer} total={exercise.amount} />
            : <Stat size={short ? 'M' : 'L'} value={exercise.amount} unit={copy.lesson.reps} />}
        </Reveal>
        <Reveal play delay={step * 3} rise={rise}>
          {/* Náročný cvik: krátký štítek CAUTION hned u názvu (vidět bez scrollu i na 320 pt), plná věta níž. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: space.s, rowGap: space.xs }}>
            <Text variant="title" accessibilityRole="header">{exercise.name}</Text>
            {exercise.caution ? (
              <View testID="exercise-caution-tag" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                style={{ borderWidth: StyleSheet.hairlineWidth, borderColor: c.borderStrong, borderRadius: radius.full, paddingHorizontal: space.s, paddingVertical: space.xs }}>
                <Text variant="label" tone="muted">{copy.fitness.cautionLabel}</Text>
              </View>
            ) : null}
          </View>
        </Reveal>
        <Reveal play delay={step * 4} rise={rise}><Text variant="body" tone="muted" style={{ maxWidth: MEASURE }}>{exercise.description}</Text></Reveal>
        {/* Náročný cvik (elite fáze 5): krátká bezpečnostní poznámka pod technikou. Mono štítek + caption,
            oddělená jen vlasovou linkou `rule` (žádná barva navíc); na nízkém displeji se odroluje se scrollem. */}
        {exercise.caution ? (
          <Reveal play delay={step * 4} rise={rise}>
            <View accessible accessibilityLabel={`${copy.fitness.cautionLabel}. ${copy.fitness.caution}`} testID="exercise-caution"
              style={{ maxWidth: MEASURE, gap: space.xs, paddingTop: short ? space.xs : space.s, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.rule }}>
              <Text variant="caption" tone="muted">{copy.fitness.caution}</Text>
            </View>
          </Reveal>
        ) : null}
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
