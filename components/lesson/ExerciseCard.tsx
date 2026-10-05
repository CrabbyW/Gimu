import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { Reveal } from '@/components/ui/choreo';
import { RegMark } from '@/components/ui/RegMark';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { intro, motion } from '@/lib/motion';
import { opacity, PHI, useTheme } from '@/theme';
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
// Horizont podlahy ve výšce panelu (zlatý řez shora): pod ním leží perspektivní mřížka.
const HORIZON = 1 / PHI;

interface Props { exercise: Exercise; /** Jen u výdrže. */ timer?: HoldTimerState }

/** Karta cviku (hero, R42; hloubka a materiál 2026-10-03). Hierarchie shora: panel siluety (větší, 240,
 *  na `surface` s horní hranou světla a perspektivní mřížkou podlahy), pod ním JEDNO velké číslo
 *  (opakování `Stat L`, u výdrže odpočet) — to je to, co má cvičenec v hlavě — pak název `title`
 *  a popis techniky. Mezi panelem a textem `space.l` (dřív xl): méně prázdna, číslo drží u postavy. */
export function ExerciseCard({ exercise, timer }: Props) {
  const { c, radius, space, size } = useTheme();
  return (
    <Animated.View entering={enter} exiting={exit} style={{ gap: space.l }}>
      <RegMark>
        <View
          style={{
            height: size.silhouettePanel, backgroundColor: c.surface, borderRadius: radius.l, padding: space.m, overflow: 'hidden',
            borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.edge,
          }}
        >
          {/* Podlaha se prolne první (zem dřív než postava), pak silueta. */}
          <Reveal play delay={intro.floor.at} rise={intro.floor.rise} config={motion.reveal} style={StyleSheet.absoluteFill}><Floor /></Reveal>
          {/* Vnitřní sled karty (motion): panel přijede s kartou, silueta v něm se zvedne o úder později,
              pak číslo, název a popis po 50 ms. Celý sled ≤ 260 + 200 ms. */}
          <Reveal play delay={step} rise={rise} style={{ flex: 1 }}><ExerciseSilhouette id={exercise.silhouette} /></Reveal>
        </View>
      </RegMark>
      <View style={{ gap: space.s }}>
        <Reveal play delay={step * 2} rise={rise}>
          {exercise.type === 'hold' && timer
            ? <HoldTimer timer={timer} />
            : <Stat size="L" value={exercise.amount} unit={copy.lesson.reps} />}
        </Reveal>
        <Reveal play delay={step * 3} rise={rise}><Text variant="title" accessibilityRole="header">{exercise.name}</Text></Reveal>
        <Reveal play delay={step * 4} rise={rise}><Text variant="body" tone="muted" style={{ maxWidth: MEASURE }}>{exercise.description}</Text></Reveal>
      </View>
    </Animated.View>
  );
}

/** Perspektivní mřížka podlahy (`rule` na `opacity.floor`): příčky zhušťující se k horizontu a podélné linky
 *  sbíhající se do středu horizontu, rozestup u spodní hrany `size.floorStep` × 2. Dekorativní, bez dotyku. */
function Floor() {
  const { c, size, stroke } = useTheme();
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { w, h } = box;
  const top = h * HORIZON;
  const depth = h - top;
  const cx = w / 2;
  const spread = size.floorStep * 2;
  const half = Math.ceil(w / spread);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={[StyleSheet.absoluteFill, { opacity: opacity.floor }]}
    >
      {w > 0 ? (
        <Svg width={w} height={h}>
          {Array.from({ length: size.floorRows }, (_, i) => {
            // Rozestup příček roste kvadraticky směrem k divákovi.
            const t = (i + 1) / size.floorRows;
            const y = top + depth * t * t;
            return <Line key={`r${i}`} x1={0} y1={y} x2={w} y2={y} stroke={c.rule} strokeWidth={stroke.hairline} />;
          })}
          {Array.from({ length: half * 2 + 1 }, (_, i) => {
            const k = i - half;
            // U horizontu se linky sbíhají na čtvrtinu rozestupu (ne do bodu): mírná perspektiva, ne tunel.
            return <Line key={`c${i}`} x1={cx + (k * spread) / 4} y1={top} x2={cx + k * spread} y2={h} stroke={c.rule} strokeWidth={stroke.hairline} />;
          })}
        </Svg>
      ) : null}
    </View>
  );
}
