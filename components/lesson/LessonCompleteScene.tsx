import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation, makeMutable, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { Mascot } from '@/components/mascot';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Screen } from '@/components/ui/Screen';
import { StreakBarbell } from '@/components/ui/StreakBarbell';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useLessonMinutes } from '@/hooks/useLessonMinutes';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { feedback } from '@/lib/feedback';
import { play, stopPattern, type Scheduler } from '@/lib/haptics';
import { celebration, ease, motion, spring, useMotionSafe } from '@/lib/motion';
import { playSfx, setDucking } from '@/lib/sound';
import { nextLessonId } from '@/logic/map';
import type { LessonResult } from '@/services';
import type { LessonPathView } from '@/services/contracts';
import { PHI, useCompact, useTheme } from '@/theme';
import type { CosmeticSlot, Lesson, Mood } from '@/types';
import { Barbell, type BarbellMotion, type PlateFlight } from './Barbell';
import { AXIS, BARBELL_H, barbellLayout, COLLAR_TRAVEL, once, splitPlates, TIMELINE_A as A, xpBreakdownLabel } from './celebration';
import { GoldenFigure } from './GoldenFigure';
import { XpPop } from './XpPop';

const t = copy.complete;
const XP_LABELS = { lesson: t.xpLesson, boss: t.xpBoss, replay: t.xpReplay, first: t.xpFirst, streak: t.xpStreak };

// Pád kotoučů (start od zobrazení scény) zůstává z `celebration` v lib/motion; vše po dopadu (t = 0) je
// časová osa úrovně (a) `TIMELINE_A` (motion spec §4.1). Vše se plánuje z UI vlákna (`withDelay` →
// `scheduleOnRN`), ne JS časovači: haptika, zvuk i vizuál téhož kroku startují ze stejného snímku.
const { launch: LAUNCH_AT, leftLag: LEFT_LAG } = celebration;
const TITLE_RISE = 8;
// Odkud kotouč přilétá (pravá strana; levá zrcadlově).
const FROM = { x: 140, rotate: 18 };
const COLLAR_MS = 120;
// Osa se po dopadu prohne o 3 pt dolů a pružinou (motion.rattle) vrátí.
const SHAKE_DEPTH = 3;
// Kotouč série přiletí 12 pt shora a osa malé činky se rozkmitne o 1 pt (§3.6).
const SERIES_DROP = 12;
const SERIES_RATTLE = 1;
const SERIES_SEAT = { damping: 25, stiffness: 520, mass: 1 };
// Omezený pohyb (spec §7.1): celá scéna jedním prolnutím, konečné stavy hned.
const REDUCED_FADE = motion.calmFade;

/** Jeden krok na UI vlákně: po `at` ms zavolá `fn` na JS (přes `scheduleOnRN`). Vrací mutable pro zrušení. */
function uiAt(at: number, fn: () => void): SharedValue<number> {
  const m = makeMutable(0);
  m.value = withDelay(at, withTiming(1, { duration: 0 }, (done) => { if (done) scheduleOnRN(fn); }));
  return m;
}

/** Plánovač haptického vzoru z UI vlákna (lib/haptics `Scheduler`, motion spec §4.4). */
const uiScheduler: Scheduler = (steps, fireStep) => {
  const ms = steps.map(([at, kind]) => uiAt(at, () => fireStep(kind)));
  return () => ms.forEach((m) => cancelAnimation(m));
};

/** „Zítra: …“: další lekce cesty (`nextLessonId`) a její `estMinutes`. Bez další lekce null. */
function tomorrowOf(view: LessonPathView | null, minutes: Record<string, number>): string | null {
  if (!view) return null;
  const nodes = view.sections.flatMap((s) => s.nodes);
  const id = nextLessonId(nodes.map((n) => n.lesson), new Set(nodes.filter((n) => n.state === 'done').map((n) => n.lesson.id)));
  const next = nodes.find((n) => n.lesson.id === id);
  return next ? copy.lesson.tomorrow(next.lesson.title, minutes[next.lesson.id] ?? 1) : null;
}

interface Props {
  result: LessonResult;
  lesson: Lesson;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  onContinue(): void;
}

/** Oslava dokončení lekce, úroveň (a) (motion spec §4.1): kotouč přiletí na osu a zacvakne (t = 0), pozadí se
 *  ztlumí, činka dojede kotoučem do středu, ring, +XP s ticky, kotouč série, opička celebrate, titulek,
 *  „Zítra: …“, CTA v 1200 ms. Výsledek je uložený dřív, než scéna začne; animace ho jen ukazuje.
 *  Tap kamkoli, odchod appky do pozadí nebo přerušený pád = `skipToEnd()` (idempotentní). */
export function LessonCompleteScene({ result, lesson, cosmetics, onContinue }: Props) {
  const { c, space, stroke } = useTheme();
  const { width } = useWindowDimensions();
  const compact = useCompact();
  const contentWidth = width - 2 * space.l;
  const { reduced } = useMotionSafe();
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [calm] = useState(reduced);
  const cheer: Mood = 'celebrate';
  const [mood, setMood] = useState<Mood>(calm ? cheer : 'idle');
  const [xpShown, setXpShown] = useState(calm);
  const [figureDrawn, setFigureDrawn] = useState(calm);
  const [ctaReady, setCtaReady] = useState(false);
  const [ended, setEnded] = useState(false);
  // Kotouč série: přibude jen při první lekci dne (série se navýšila).
  const seriesGain = result.xp.firstOfDay > 0 && result.streak > 0;
  const [seriesLanded, setSeriesLanded] = useState(calm || !seriesGain);
  const impacted = useRef(false);
  const steps = useRef<SharedValue<number>[]>([]);

  const profile = useProfile();
  const pathId = profile.status === 'ready' ? profile.data?.path : undefined;
  const path = useLessonPath(pathId);
  const view = path.status === 'ready' ? path.data : null;
  const minutes = useLessonMinutes(view);
  const tomorrow = useMemo(() => tomorrowOf(view, minutes), [view, minutes]);

  const [layout] = useState(() => {
    const { loaded, flying } = splitPlates(result.completedPlates, lesson.plateKg);
    return barbellLayout(loaded, flying, (width - 2 * space.l) / 2);
  });
  const figureR = Math.min(contentWidth / PHI / 2 / (compact ? PHI : 1), AXIS.mid);
  const figureCx = contentWidth / 2 + layout.flying.offset + layout.flying.w / 2;
  // Kotouč do středu: celá činka se posune tak, aby nově nacvaknutý kotouč stál uprostřed obsahu.
  const centerShift = contentWidth / 2 - figureCx;
  const ringR = layout.flying.h / 2 + space.m;
  const title = result.xp.baseKind === 'replay' ? t.replayTitle : t.title;

  const sceneOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(calm ? 1 : 0);
  const tomorrowOpacity = useSharedValue(calm ? 1 : 0);
  const shake = useSharedValue(0);
  const punch = useSharedValue(1);
  const ctaIn = useSharedValue(calm ? 1 : 0);
  const dim = useSharedValue(calm ? 1 : 0);
  const center = useSharedValue(calm ? 1 : 0);
  const ring = useSharedValue(calm ? 1 : 0);
  const seriesY = useSharedValue(0);
  const start = calm ? { x: 0, rotate: 0 } : FROM;
  const startDrop = calm ? 1 : 0;
  const startCollar = calm ? 0 : COLLAR_TRAVEL;
  const right: PlateFlight = {
    drop: useSharedValue(startDrop), seat: useSharedValue(0), x: useSharedValue(start.x), rotate: useSharedValue(start.rotate), collar: useSharedValue(startCollar), heat: useSharedValue(0),
  };
  const left: PlateFlight = {
    drop: useSharedValue(startDrop), seat: useSharedValue(0), x: useSharedValue(-start.x), rotate: useSharedValue(-start.rotate), collar: useSharedValue(startCollar), heat: useSharedValue(0),
  };
  const bar: BarbellMotion = { right, left, opacity: useSharedValue(calm ? 0 : 1) };

  const at = (ms: number, fn: () => void) => { steps.current.push(uiAt(ms, fn)); };
  const cancelSteps = () => { steps.current.forEach((m) => cancelAnimation(m)); steps.current = []; };

  // Konec bez vizuálu: haptika, kroky, ducking. Sdílí ho `skipToEnd` i unmount.
  const teardownGate = useRef<ReturnType<typeof once> | null>(null);
  const teardown = () => { (teardownGate.current ??= once(() => { stopPattern(); setDucking(false); })).run(); };

  // Přeskočení na konečný stav (§4.4). Idempotentní; žádná haptika ani zvuk za přeskočení.
  const doSkip = () => {
    impacted.current = true;
    cancelSteps();
    teardown();
    const fin = { duration: A.skipMs, easing: ease.out };
    for (const side of [right, left]) {
      for (const v of [side.drop, side.seat, side.x, side.rotate, side.collar, side.heat]) cancelAnimation(v);
      side.drop.set(1); side.seat.set(0); side.x.set(0); side.rotate.set(0); side.collar.set(0); side.heat.set(0);
    }
    for (const v of [sceneOpacity, bar.opacity, titleOpacity, tomorrowOpacity, ctaIn, dim, center, ring]) {
      cancelAnimation(v);
      v.set(withTiming(1, fin));
    }
    cancelAnimation(shake); shake.set(0);
    cancelAnimation(punch); punch.set(1);
    cancelAnimation(seriesY); seriesY.set(0);
    setFigureDrawn(true);
    setXpShown(true);
    setSeriesLanded(true);
    setMood(cheer);
    setCtaReady(true);
    setEnded(true);
  };
  const skipGate = useRef<ReturnType<typeof once> | null>(null);
  const skipToEnd = () => { (skipGate.current ??= once(doSkip)).run(); };

  // t = 0: dopad pravého kotouče (první dotek osy). Vzor `lesson-complete` (heavy, rigid +80 … success +1250)
  // z UI vlákna, cvak zámku, rozkmit osy, a celá časová osa (a).
  const onImpact = () => {
    if (impacted.current) return;
    impacted.current = true;
    play('lesson-complete', uiScheduler);
    playSfx('plateSnap');
    if (calm) {
      // Omezený pohyb: konečný stav už stojí, haptika a zvuky zůstávají; CTA se scénou.
      at(A.ring, () => playSfx('ring'));
      if (seriesGain) at(A.seriesPlate, () => feedback('seriesPlate'));
      setCtaReady(true);
      return;
    }
    setFigureDrawn(true);
    shake.set(withSequence(withTiming(SHAKE_DEPTH, { duration: 50 }), withSpring(0, motion.rattle)));
    punch.set(withSequence(withTiming(motion.punch.scale, { duration: motion.punch.inMs, easing: ease.out }), withTiming(1, motion.release)));
    dim.set(withTiming(1, { duration: A.dimMs, easing: ease.out }));
    center.set(withDelay(A.center, withSpring(1, spring.kotouc)));
    ring.set(withDelay(A.ring, withTiming(1, { duration: A.ringMs, easing: ease.out })));
    at(A.ring, () => playSfx('ring'));
    at(A.xp, () => setXpShown(true));
    if (seriesGain) {
      at(A.seriesPlate, () => {
        setSeriesLanded(true);
        feedback('seriesPlate');
        seriesY.set(withSequence(withTiming(-SERIES_DROP, { duration: 0 }), withSpring(0, SERIES_SEAT), withTiming(SERIES_RATTLE, { duration: 40 }), withSpring(0, motion.rattle)));
      });
    }
    at(A.pose, () => setMood(cheer));
    at(A.title, () => titleOpacity.set(withTiming(1, motion.enter)));
    at(A.tomorrow, () => tomorrowOpacity.set(withTiming(1, motion.enter)));
    at(A.cta, () => { setCtaReady(true); ctaIn.set(withTiming(1, motion.reveal)); });
  };

  useEffect(() => {
    setDucking(true);
    sceneOpacity.set(withTiming(1, calm ? REDUCED_FADE : motion.reveal));
    if (calm) {
      bar.opacity.set(withDelay(LAUNCH_AT, withTiming(1, REDUCED_FADE, (fin) => { scheduleOnRN(fin ? onImpact : skipToEnd); })));
    } else {
      // Oblouk: svisle zrychlující pád (motion.fall), vodorovně a rotačně dobíhá (ease-out) stejně dlouho.
      // V okamžiku dotyku (UI vlákno) převezme pohyb dosednutí `seat`, objímka dojede, kotouč se rozžhaví.
      // Přerušený pád (done === false) = přeskočení na konec.
      const fly = (side: PlateFlight, delay: number, lead: boolean) => {
        side.drop.set(withDelay(delay, withTiming(1, motion.fall, (done) => {
          if (!done) { if (lead) scheduleOnRN(skipToEnd); return; }
          side.seat.set(withSpring(0, motion.seat));
          side.collar.set(withTiming(0, { duration: COLLAR_MS, easing: motion.ui.easing }));
          side.heat.set(withSequence(withTiming(celebration.heat.peak, { duration: 0 }), withTiming(0, { duration: celebration.heat.coolMs, easing: ease.out })));
          if (lead) scheduleOnRN(onImpact);
        })));
        side.x.set(withDelay(delay, withTiming(0, { duration: motion.fall.duration, easing: motion.ui.easing })));
        side.rotate.set(withDelay(delay, withTiming(0, { duration: motion.fall.duration, easing: motion.ui.easing })));
      };
      fly(right, LAUNCH_AT, true);
      fly(left, LAUNCH_AT + LEFT_LAG, false);
    }
    const sub = AppState.addEventListener('change', (s) => { if (s === 'background') skipToEnd(); });
    return () => {
      sub.remove();
      cancelSteps();
      teardown();
    };
    // Sekvence běží jednou při vstupu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sceneStyle = useAnimatedStyle(() => ({ opacity: sceneOpacity.value }));
  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: shake.value }] }));
  const centerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: center.value * centerShift }] }));
  const punchStyle = useAnimatedStyle(() => ({ transform: [{ scale: punch.value }] }));
  const titleRise = calm ? 0 : TITLE_RISE;
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: (1 - titleOpacity.value) * titleRise }] }));
  const tomorrowStyle = useAnimatedStyle(() => ({ opacity: tomorrowOpacity.value }));
  const seriesStyle = useAnimatedStyle(() => ({ transform: [{ translateY: seriesY.value }] }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaIn.value }));
  const ringLen = 2 * Math.PI * ringR;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: ringLen * (1 - ring.value), opacity: ring.value }));

  return (
    <View style={{ flex: 1, backgroundColor: c.base, overflow: 'hidden' }}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }, dimStyle]} />
      {/* Tap kamkoli = přeskočit na konec; CTA má vlastní Pressable a má přednost. */}
      <Pressable style={{ flex: 1 }} onPress={skipToEnd} accessible={false}>
        <Animated.View style={[{ flex: 1 }, sceneStyle, punchStyle]}>
          <Screen edges={['top']}>
            <Animated.View style={[{ paddingTop: compact ? space.l : space.xl }, titleStyle]}>
              <Text variant={compact ? 'title' : 'display'} accessibilityRole="header">{title}</Text>
            </Animated.View>
            <View style={{ flex: 1, justifyContent: 'center', paddingBottom: compact ? space.m : space.xl }}>
              <Animated.View style={[{ marginBottom: compact ? space.l : space.xl }, shakeStyle]}>
                <Animated.View style={centerStyle}>
                  <Svg width={contentWidth} height={BARBELL_H} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
                    <AnimatedRing
                      cx={figureCx} cy={AXIS.mid} r={ringR} stroke={c.accentGraphic} strokeWidth={stroke.nodeRing}
                      dash={ringLen} animatedProps={ringProps}
                    />
                  </Svg>
                  <GoldenFigure r={figureR} cx={figureCx} cy={AXIS.mid} drawn={figureDrawn} calm={calm} />
                  <Barbell width={contentWidth} layout={layout} motion={bar} />
                </Animated.View>
              </Animated.View>
              <XpPop
                total={result.xp.total}
                breakdown={xpBreakdownLabel(result.xp, XP_LABELS)}
                shown={xpShown}
                calm={calm}
                final={ended}
                width={contentWidth}
                aside={(px) => <Mascot stage={result.stageBefore} cosmetics={cosmetics} mood={mood} size={px} hop={false} />}
              />
              <Animated.View style={[{ marginTop: space.m, flexDirection: 'row', alignItems: 'center', gap: space.s }, seriesStyle]}>
                <StreakBarbell variant="sm" streak={seriesLanded ? result.streak : result.streak - 1} longest={result.streak} todayDone={seriesLanded} />
                <Text variant="label" tone="accent">{seriesLanded ? result.streak : result.streak - 1}</Text>
              </Animated.View>
              {tomorrow ? (
                <Animated.View style={[{ marginTop: space.s }, tomorrowStyle]}>
                  <Text variant="caption" tone="muted">{tomorrow}</Text>
                </Animated.View>
              ) : null}
            </View>
          </Screen>
        </Animated.View>
      </Pressable>
      {/* CTA nastoupí v 1200 ms (§4.1); místo je rezervované, layout se nehýbe. */}
      <Animated.View style={ctaStyle}>
        <BigActionBar primary={{ label: t.cta, onPress: onContinue, disabled: !ctaReady }} />
      </Animated.View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Ring oslavy (`accentGraphic`, §4.1): trim 0 → 100 % a opacita 0 → 1, začíná nahoře. */
function AnimatedRing({ cx, cy, r, stroke, strokeWidth, dash, animatedProps }: {
  cx: number; cy: number; r: number; stroke: string; strokeWidth: number; dash: number;
  animatedProps: Partial<{ strokeDashoffset: number; opacity: number }>;
}) {
  return (
    <AnimatedCircle
      cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round"
      strokeDasharray={`${dash} ${dash}`} transform={`rotate(-90 ${cx} ${cy})`} animatedProps={animatedProps}
    />
  );
}
