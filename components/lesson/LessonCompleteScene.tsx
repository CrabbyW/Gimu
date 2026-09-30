import { useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Mascot } from '@/components/mascot';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';
import type { LessonResult } from '@/services';
import { useTheme } from '@/theme';
import type { CosmeticSlot, Lesson, Mood } from '@/types';
import { Barbell, type BarbellMotion, type PlateFlight } from './Barbell';
import { barbellLayout, COLLAR_TRAVEL, splitPlates, xpBreakdownLabel } from './celebration';
import { XpPop } from './XpPop';

const t = copy.complete;
const XP_LABELS = { lesson: t.xpLesson, boss: t.xpBoss, replay: t.xpReplay, first: t.xpFirst, streak: t.xpStreak };

// Časová osa oslavy (ms). Start kotouče se počítá od zobrazení scény, zbytek od dopadu.
const LAUNCH_AT = 250;
const LEFT_LAG = 60;
const XP_AFTER_IMPACT = 120;
const TITLE_AFTER_IMPACT = 700;
const CTA_AFTER_IMPACT = 900;
// Odkud kotouč přilétá (pravá strana; levá zrcadlově).
const FROM = { x: 140, rotate: 18 };
const ROTATE_MS = 420;
const COLLAR_MS = 120;
// Omezený pohyb (spec §6.7): místo pružin se konečný stav jen prolne.
const REDUCED_FADE = { duration: 200 };
// Opice (M = 120 pt) zarovnaná chodidly k účaří velkého čísla XP.
const MASCOT_LIFT = 32;

interface Props {
  result: LessonResult;
  lesson: Lesson;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  onContinue(): void;
}

/** Oslava dokončení lekce: kotouč přiletí na osu a zacvakne, +XP, opice se raduje.
 *  Výsledek je uložený dřív, než scéna začne; animace ho jen ukazuje. */
export function LessonCompleteScene({ result, lesson, cosmetics, onContinue }: Props) {
  const { c, space } = useTheme();
  const { width } = useWindowDimensions();
  const { reduced } = useMotionSafe();
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [calm] = useState(reduced);
  const [mood, setMood] = useState<Mood>('idle');
  const [xpShown, setXpShown] = useState(false);
  const [ctaReady, setCtaReady] = useState(false);
  const impacted = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [layout] = useState(() => {
    const { loaded, flying } = splitPlates(result.completedPlates, lesson.plateKg);
    return barbellLayout(loaded, flying, (width - 2 * space.l) / 2);
  });
  const cheer: Mood = lesson.isBoss || result.stageAfter > result.stageBefore ? 'celebrate' : 'happy';
  const title = result.xp.baseKind === 'replay' ? t.replayTitle : t.title;

  const sceneOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const shake = useSharedValue(0);
  const start = calm ? { x: 0, rotate: 0 } : FROM;
  const startDrop = calm ? 1 : 0;
  const right: PlateFlight = { drop: useSharedValue(startDrop), x: useSharedValue(start.x), rotate: useSharedValue(start.rotate) };
  const left: PlateFlight = { drop: useSharedValue(startDrop), x: useSharedValue(-start.x), rotate: useSharedValue(-start.rotate) };
  const bar: BarbellMotion = { right, left, opacity: useSharedValue(calm ? 0 : 1), collar: useSharedValue(COLLAR_TRAVEL) };

  const onImpact = () => {
    if (impacted.current) return;
    impacted.current = true;
    haptics.snap();
    if (calm) {
      bar.collar.set(0);
    } else {
      shake.set(withSequence(withTiming(3, { duration: 50 }), withSpring(0, { damping: 6, stiffness: 400 })));
      bar.collar.set(withTiming(0, { duration: COLLAR_MS, easing: motion.ui.easing }));
    }
    const at = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };
    at(XP_AFTER_IMPACT, () => { setXpShown(true); setMood(cheer); });
    at(TITLE_AFTER_IMPACT, () => { titleOpacity.set(withTiming(1, calm ? REDUCED_FADE : motion.reveal)); });
    at(CTA_AFTER_IMPACT, () => setCtaReady(true));
  };

  // Dopad = první dotek osy (pravý kotouč dosáhne cílové polohy), ne až doznění přestřelu pružiny.
  useAnimatedReaction(
    () => right.drop.value >= 1,
    (landed, before) => { if (!calm && landed && before === false) scheduleOnRN(onImpact); },
  );

  useEffect(() => {
    sceneOpacity.set(withTiming(1, calm ? REDUCED_FADE : motion.reveal));
    if (calm) {
      bar.opacity.set(withDelay(LAUNCH_AT, withTiming(1, REDUCED_FADE, (fin) => { if (fin) scheduleOnRN(onImpact); })));
    } else {
      const fly = (side: PlateFlight, delay: number) => {
        side.drop.set(withDelay(delay, withSpring(1, motion.snap)));
        side.x.set(withDelay(delay, withTiming(0, { duration: ROTATE_MS, easing: motion.ui.easing })));
        side.rotate.set(withDelay(delay, withTiming(0, { duration: ROTATE_MS })));
      };
      fly(right, LAUNCH_AT);
      fly(left, LAUNCH_AT + LEFT_LAG);
    }
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
    // Sekvence běží jednou při vstupu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneStyle = useAnimatedStyle(() => ({ opacity: sceneOpacity.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shake.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));

  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <Animated.View style={[{ flex: 1 }, sceneStyle]}>
        <Screen edges={['top']}>
          <Animated.View style={[{ paddingTop: space.xl }, titleStyle]}>
            <Text variant="display" accessibilityRole="header">{title}</Text>
          </Animated.View>
          <View style={{ flex: 1, justifyContent: 'center', paddingBottom: space.xl }}>
            <Animated.View style={[{ marginBottom: space.xl }, shakeStyle]}>
              <Barbell width={width - 2 * space.l} layout={layout} motion={bar} />
            </Animated.View>
            {/* Opice stojí vpravo u čísla, které právě vydřela: odměna a její svědek v jednom pohledu. */}
            <View>
              <View style={{ position: 'absolute', right: 0, top: -MASCOT_LIFT }}>
                <Mascot stage={result.stageBefore} cosmetics={cosmetics} mood={mood} size="M" />
              </View>
              <XpPop total={result.xp.total} breakdown={xpBreakdownLabel(result.xp, XP_LABELS)} shown={xpShown} calm={calm} />
            </View>
          </View>
        </Screen>
      </Animated.View>
      <BigActionBar primary={{ label: t.cta, onPress: onContinue, disabled: !ctaReady }} />
    </View>
  );
}
