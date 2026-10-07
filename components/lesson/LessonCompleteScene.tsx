import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing, ReduceMotion, cancelAnimation, makeMutable, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurMask, Canvas, Group, Points, vec } from '@shopify/react-native-skia';
import { scheduleOnRN } from 'react-native-worklets';
import { DotField, DotPlate, DotRow, SkiaGuard, plateDotRadius, useDotInk, useDotTouch } from '@/components/dots';
import { spiralLerp, type Pt } from '@/components/dots/animate';
import { plateDots, ringCountForKg, ringDots, spiralOrder } from '@/components/dots/geometry';
import { Mascot, useMascotReactions } from '@/components/mascot';
import { GuideBubble } from '@/components/mascot/GuideBubble';
import { PillButton } from '@/components/ui/PillButton';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useLessonMinutes } from '@/hooks/useLessonMinutes';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { feedback } from '@/lib/feedback';
import { fire } from '@/lib/haptics';
import { ease, lessonDone as L, motion, plateFlight as PF, spring, useMotionSafe } from '@/lib/motion';
import { takeLastRect } from '@/lib/plateFlight';
import { playSfx, setDucking } from '@/lib/sound';
import { REACTION_COOLDOWN_MS } from '@/logic/mascotReactions';
import { nextLessonId } from '@/logic/map';
import type { GuideId } from '@/logic/guide';
import type { LessonResult } from '@/services';
import type { LessonPathView } from '@/services/contracts';
import { dots, useCompact, useShort, useTheme } from '@/theme';
import type { CosmeticSlot, Lesson, Mood } from '@/types';
import { celebrationHaptics, celebrationTimeline, fieldGrid, gatherSources, once, stepOf, xpBreakdownLabel, xpTickStep } from './celebration';

const t = copy.complete;
const XP_LABELS = { lesson: t.xpLesson, boss: t.xpBoss, replay: t.xpReplay, first: t.xpFirst, streak: t.xpStreak };
const TAU = Math.PI * 2;
const NEVER = { reduceMotion: ReduceMotion.Never };
/** Tečky shock prstence (stejná hustota jako vnější prstenec kotouče). */
const SHOCK_DOTS = 48;
/** Řada série: týden na řádek. */
const WEEK = 7;

/** Jeden krok na UI vlákně: po `at` ms zavolá `fn` na JS (přes `scheduleOnRN`). Vrací mutable pro zrušení.
 *  Haptika, zvuk i vizuál téhož kroku tak startují ze stejného snímku (ne z JS časovače). */
function uiAt(at: number, fn: () => void): SharedValue<number> {
  const m = makeMutable(0);
  m.value = withDelay(at, withTiming(1, { duration: 0, ...NEVER }, (done) => { if (done) scheduleOnRN(fn); }));
  return m;
}

/** „Zítra · …“: další lekce cesty (`nextLessonId`) a její `estMinutes`. Bez další lekce věta o sekci. */
function tomorrowOf(view: LessonPathView | null, minutes: Record<string, number>): string | null {
  if (!view) return null;
  const nodes = view.sections.flatMap((s) => s.nodes);
  const id = nextLessonId(nodes.map((n) => n.lesson), new Set(nodes.filter((n) => n.state === 'done').map((n) => n.lesson.id)));
  const next = nodes.find((n) => n.lesson.id === id);
  return next ? copy.lesson.tomorrow(next.lesson.title, minutes[next.lesson.id] ?? 1) : copy.lesson.sectionDone;
}

/** Řada série: celé týdny (7 na řádek), aspoň jeden, nejvýš tři (delší série = plná řada). */
export const seriesTotal = (streak: number) => Math.min(3, Math.max(1, Math.ceil(streak / WEEK))) * WEEK;

interface Props {
  result: LessonResult;
  lesson: Lesson;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  onContinue(): void;
  /** Opička průvodce (first run): „That’s your first plate“ pod kotoučem, nastoupí s CTA. */
  guide?: { id: GuideId; dismiss(): void };
  /** Krátký onboarding: sekundární pilulka [SET YOUR GOALS] pod [CONTINUE] (jen dokud `needsSetup`). */
  onSetGoals?: () => void;
}

/**
 * Vlajková loď (Nothing Dot spec §5): dokončení lekce z teček. Výsledek je uložený dřív, než scéna začne;
 * animace ho jen ukazuje a nic neblokuje (tap kamkoli = přeskočit na konec, CTA pak hned funguje).
 *
 *    0 ms  celoplošné pole teček se rozsvítí vlnou od středu kotouče (`DotField.wave`, 800 ms)
 *  200 ms  tečky pole vzlétnou a vírem (`twist` 2.6) se slétnou do prstenců kotouče (1100 ms, pořadí `spiralOrder`);
 *          haptické crescendo 7 zrychlujících tiků (selection → light); od 60 % letu se kotouč nadechne na 1.08
 * 1300 ms  nacvaknutí: 1.08 → 1 pružinou `spring.kotouc`, heavy + cvak, za 110 ms success; tečkový shock prstenec
 *          a rázová vlna polem z kotouče přes obrazovku (900 ms, rozzáření); kotouč se roztočí (0.6 otáčky,
 *          1400 ms ease-out) a zpomalí do ambientní rotace s kometou
 * 1450 ms  opička reakce celebrate + jantarová hrana šálu, titulek, XP napočítá (900 ms, tik na každém kroku),
 *          řada série se rozsvítí tečka po tečce a přibude +1
 * 2350 ms  XP doběhne: dvojitý „heartbeat“ medium → light (120 ms)
 * 2600 ms  CTA [POKRAČOVAT] nastoupí zdola
 *
 * Vše na UI vlákně (shared values, Skia `useDerivedValue`); React stav jen pro náladu opice, číslo XP (≤ 8 ticků)
 * a řadu série. Omezený pohyb: konečný stav jedním prolnutím 200 ms, haptika success zůstává.
 * Odchod appky do pozadí = přeskočení na konec.
 */
export function LessonCompleteScene({ result, lesson, cosmetics, onContinue, guide, onSetGoals }: Props) {
  const { c, space, size } = useTheme();
  const ink = useDotInk();
  const insets = useSafeAreaInsets();
  const compact = useCompact();
  // Nízký displej (568): menší kotouč, bez řádku „Tomorrow“, [SET YOUR GOALS] jako textová akce. Nic se nepřekrývá.
  const short = useShort();
  const tight = compact || short;
  const { reduced } = useMotionSafe();
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [calm] = useState(reduced);
  const tl = useMemo(() => celebrationTimeline(calm), [calm]);
  const touch = useDotTouch(!calm);
  // Reakce opičky (fáze 3): dokončení lekce = celebrate, série +1 = proud až po něm (cooldown oslavy).
  // Scéna je modální a krátká: nečinnost se nepočítá (focused=false).
  // Do plánovaných kroků (UI vlákno → scheduleOnRN) jde jen funkce `report`, nikdy objekt s gestem.
  const { report: reportReaction, reaction: mascotReaction } = useMascotReactions(false);

  // --- Rozměry: plocha scény (onLayout) a střed kotouče v ní (measureInWindow) ---
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [center, setCenter] = useState<Pt | null>(null);
  // Let kotouče (spec §2.3): kam kotouč v lekci zmizel (okno). Tečky pak slétají odtud, jinak z pole kolem středu.
  const [lastPlate] = useState(takeLastRect);
  const [flyFrom, setFlyFrom] = useState<Pt | null>(null);
  const rootRef = useRef<View>(null);
  const plateRef = useRef<View>(null);
  const contentW = (box?.w ?? 0) - 2 * space.l;
  const P = Math.max(0, Math.min(contentW * L.plateFrac, short ? size.celebratePlateShort : L.plateMax));
  const dotR = plateDotRadius(P);
  const kg = lesson.plateKg;
  const measure = () => {
    rootRef.current?.measureInWindow((rx, ry) => {
      plateRef.current?.measureInWindow((px, py, pw, ph) => {
        if (lastPlate) setFlyFrom({ x: lastPlate.x + lastPlate.width / 2 - rx, y: lastPlate.y + lastPlate.height / 2 - ry });
        setCenter({ x: px - rx + pw / 2, y: py - ry + ph / 2 });
      });
    });
  };
  const onRootLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (b && b.w === width && b.h === height ? b : { w: width, h: height }));
  };

  // --- Geometrie letu: cíle = tečky kotouče (stejné jako `DotPlate`), starty = tečky pole ---
  const flight = useMemo(() => {
    if (!box || !center || P <= 0) return null;
    const targets = plateDots(kg, P / 2 - dotR);
    const grid = fieldGrid(box.w, box.h, dots.field.pitch, L.fieldMax);
    // Známá poloha kotouče z lekce: tečky vyletí z malého shluku tam (tvar kotouče × `PF.gatherSpread`).
    const src = flyFrom
      ? targets.map((d) => ({ x: flyFrom.x - center.x + d.x * PF.gatherSpread, y: flyFrom.y - center.y + d.y * PF.gatherSpread }))
      : gatherSources(targets, P / 2, ringCountForKg(kg), center.x, center.y, grid);
    const rank = new Array<number>(targets.length);
    spiralOrder(targets).forEach((idx, r) => { rank[idx] = r / targets.length; });
    return { src, tgt: targets.map((d) => ({ x: d.x, y: d.y })), rank, shock: ringDots(SHOCK_DOTS, P / 2 - dotR).map((d) => ({ x: d.x + center.x, y: d.y + center.y })) };
  }, [box, center, flyFrom, P, dotR, kg]);

  // --- Stav (React) ---
  const cheer: Mood = 'celebrate';
  const [mood, setMood] = useState<Mood>(calm ? cheer : 'idle');
  const [ctaReady, setCtaReady] = useState(calm);
  const seriesGain = result.xp.firstOfDay > 0 && result.streak > 0;
  const total = seriesTotal(result.streak);
  const [seriesLit, setSeriesLit] = useState(calm || !seriesGain ? result.streak : result.streak - 1);
  const [xpShown, setXpShown] = useState(calm ? result.xp.total : 0);

  const profile = useProfile();
  const pathId = profile.status === 'ready' ? profile.data?.path : undefined;
  const path = useLessonPath(pathId);
  const view = path.status === 'ready' ? path.data : null;
  const minutes = useLessonMinutes(view);
  const tomorrow = useMemo(() => tomorrowOf(view, minutes), [view, minutes]);
  const title = result.xp.baseKind === 'replay' ? t.replayTitle : t.title;

  // --- Sdílené hodnoty (UI vlákno) ---
  const sceneIn = useSharedValue(calm ? 0 : 1);
  const wave = useSharedValue(0);
  const gather = useSharedValue(calm ? 1 : 0);
  const swell = useSharedValue(1);
  const plateOn = useSharedValue(calm ? 1 : 0);
  const shock = useSharedValue(0);
  const spin = useSharedValue(0);
  const mascotIn = useSharedValue(calm ? 1 : 0);
  const textIn = useSharedValue(calm ? 1 : 0);
  const ctaIn = useSharedValue(calm ? 1 : 0);
  const xp = useSharedValue(calm ? result.xp.total : 0);
  const steps = useRef<SharedValue<number>[]>([]);
  const at = (ms: number, fn: () => void) => { steps.current.push(uiAt(ms, fn)); };
  const cancelSteps = () => { steps.current.forEach((m) => cancelAnimation(m)); steps.current = []; };

  // Každý krok napočítání: číslo + tik (zvuk; haptiku drží podpis `celebrationHaptics`). Po přeskočení bez tiku.
  const onXpStep = (v: number) => {
    setXpShown(v);
    if (!calm && v > 0 && !skipGate.current?.done) feedback('xpTick');
  };
  // Napočítání XP: nejvýš 8 ticků (`xpTickStep`), React se překreslí jen na hranici ticku.
  const xpStep = xpTickStep(result.xp.total);
  useAnimatedReaction(
    () => Math.min(result.xp.total, Math.ceil(xp.value / xpStep) * xpStep),
    (v, prev) => { if (v !== prev) scheduleOnRN(onXpStep, v); },
  );

  const teardownGate = useRef<ReturnType<typeof once> | null>(null);
  const teardown = () => { (teardownGate.current ??= once(() => setDucking(false))).run(); };

  // Ambientní rotace nacvaknutého kotouče (aktuální = 24 s / otáčka), s omezeným pohybem stojí.
  const startSpin = (kick = false) => {
    if (calm) return;
    const from = kick ? L.spinKick.turns * TAU : 0;
    const ambient = withRepeat(withTiming(from + TAU, { duration: motion.plateSpin.currentMs, easing: Easing.linear, ...NEVER }), -1, false);
    // Po nacvaknutí: roztočení z víru (ease-out = zpomalí), pak plynule ambientní rotace.
    spin.value = kick ? withSequence(withTiming(from, { duration: L.spinKick.ms, easing: ease.out, ...NEVER }), ambient) : ambient;
  };

  // Přeskočení na konečný stav (tap kamkoli, pozadí). Idempotentní; bez haptiky a zvuku.
  const doSkip = () => {
    cancelSteps();
    const fin = { duration: L.skipMs, easing: ease.out, ...NEVER };
    for (const v of [wave, gather, swell, shock, xp]) cancelAnimation(v);
    wave.value = 0;
    gather.value = 1;
    swell.value = 1;
    shock.value = 0;
    xp.value = result.xp.total;
    for (const v of [plateOn, mascotIn, textIn, ctaIn, sceneIn]) { cancelAnimation(v); v.value = withTiming(1, fin); }
    if (spin.value === 0) startSpin();
    setMood(cheer);
    setSeriesLit(result.streak);
    setXpShown(result.xp.total);
    setCtaReady(true);
  };
  const skipGate = useRef<ReturnType<typeof once> | null>(null);
  const skipToEnd = () => { (skipGate.current ??= once(doSkip)).run(); };

  // Choreografie startuje, až je změřený střed kotouče (1–2 snímky po mountu).
  const started = useRef(false);
  useEffect(() => {
    if (started.current || !flight) return;
    started.current = true;
    setDucking(true);
    if (calm) {
      // Omezený pohyb: konečný stav jedním prolnutím, potvrzení dokončení zůstává hmatové (jen success).
      sceneIn.value = withTiming(1, { duration: L.reducedMs, easing: ease.out, ...NEVER });
      for (const [, kind] of celebrationHaptics(true)) fire(kind);
      playSfx('snap');
      reportReaction({ type: 'lessonDone' });
      return;
    }
    const field = stepOf(tl, 'field');
    const gat = stepOf(tl, 'gather');
    const snap = stepOf(tl, 'snap');
    const cheerStep = stepOf(tl, 'mascot');
    const cta = stepOf(tl, 'cta');
    // Haptický podpis: každý úder plánovaný z UI vlákna (sedí na snímek s animací); přeskočení zbytek zruší.
    for (const [ms, kind] of celebrationHaptics(false)) at(ms, () => fire(kind));
    // 0: vlna od kotouče přeběhne pole.
    wave.value = withDelay(field.at, withTiming(1, { duration: field.durationMs, easing: Easing.out(Easing.quad), ...NEVER }));
    // 200: let teček (lineární průběh, každá tečka má vlastní ease-out v `flying`).
    gather.value = withDelay(gat.at, withTiming(1, { duration: gat.durationMs, easing: Easing.linear, ...NEVER }));
    // Nádech před nacvaknutím: kotouč se v druhé půlce letu roztáhne na `snapScale`.
    const swellAt = gat.at + gat.durationMs * L.swellFrom;
    swell.value = withDelay(swellAt, withTiming(L.snapScale, { duration: snap.at - swellAt, easing: ease.out, ...NEVER }));
    // 1300: nacvaknutí: shock prstenec + rázová vlna polem, roztočení kotouče.
    at(snap.at, () => {
      plateOn.value = 1;
      swell.value = withSpring(1, { ...spring.kotouc, ...NEVER });
      shock.value = withTiming(1, { duration: L.shockMs, easing: ease.punch, ...NEVER });
      wave.value = 0;
      wave.value = withTiming(1, { duration: L.shockWaveMs, easing: Easing.out(Easing.cubic), ...NEVER });
      startSpin(true);
      playSfx('snap');
    });
    // 1450: opička, titulek, XP, série.
    at(cheerStep.at, () => {
      setMood(cheer);
      reportReaction({ type: 'lessonDone' });
      mascotIn.value = withSpring(1, { ...motion.settle, ...NEVER });
      textIn.value = withTiming(1, { ...motion.reveal, ...NEVER });
      xp.value = withTiming(result.xp.total, { duration: cheerStep.durationMs, easing: ease.out, ...NEVER });
    });
    if (seriesGain) {
      // Řada se rozsvítí skenem (`DotRow` intro) a po něm přibude dnešní tečka.
      const scanMs = (motion.dotScanMs * Math.max(1, result.streak - 1)) / total;
      at(cheerStep.at + scanMs, () => { setSeriesLit(result.streak); feedback('seriesPlate'); });
      // Hrdost po oslavě: až skončí její cooldown, jinak by ji vyšší priorita celebrate zahodila.
      at(cheerStep.at + Math.max(scanMs, REACTION_COOLDOWN_MS), () => reportReaction({ type: 'streakUp' }));
    }
    // 2600: CTA zdola, až po doznění XP a heartbeatu.
    at(cta.at, () => { setCtaReady(true); ctaIn.value = withTiming(1, { ...motion.reveal, ...NEVER }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sekvence běží jednou, až je geometrie
  }, [flight]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'background') skipToEnd(); });
    return () => { sub.remove(); cancelSteps(); teardown(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jednou při mountu
  }, []);

  // --- Tečky v letu (Skia, UI vlákno) ---
  const flyingPts = useDerivedValue(() => {
    const p = gather.value;
    if (!flight || p <= 0 || plateOn.value >= 1) return [] as Pt[];
    const cx = center ? center.x : 0;
    const cy = center ? center.y : 0;
    const span = 1 - L.gatherStagger;
    const out: Pt[] = [];
    for (let i = 0; i < flight.tgt.length; i++) {
      const local = (p - flight.rank[i]! * L.gatherStagger) / span;
      if (local <= 0) continue; // ještě nevzlétla: zůstává zhasnutou tečkou pole
      const k = Math.min(1, local);
      const e = 1 - (1 - k) * (1 - k) * (1 - k);
      const q = spiralLerp(flight.src[i]!, flight.tgt[i]!, e, L.twist);
      out.push({ x: cx + q.x, y: cy + q.y });
    }
    return out;
  });
  const swellTransform = useDerivedValue(() => [{ scale: swell.value }]);
  const shockTransform = useDerivedValue(() => [{ scale: 1 + (motion.shock.to - 1) * shock.value }]);
  const shockOpacity = useDerivedValue(() => (shock.value > 0 && shock.value < 1 ? (1 - shock.value) * motion.shock.from : 0));
  const origin = vec(center?.x ?? 0, center?.y ?? 0);

  // --- Styly ---
  const sceneStyle = useAnimatedStyle(() => ({ opacity: sceneIn.value }));
  const plateStyle = useAnimatedStyle(() => ({ opacity: plateOn.value, transform: [{ scale: swell.value }] }));
  const rise = calm ? 0 : space.m;
  const mascotStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, mascotIn.value), transform: [{ translateY: (1 - mascotIn.value) * rise }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textIn.value, transform: [{ translateY: (1 - textIn.value) * rise }] }));
  const ctaRise = calm ? 0 : L.ctaRise;
  // CTA se s omezeným pohybem prolíná se scénou (ne dřív než obsah).
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaIn.value * sceneIn.value, transform: [{ translateY: (1 - ctaIn.value) * ctaRise }] }));

  return (
    <GestureDetector gesture={touch.gesture}>
      <View ref={rootRef} onLayout={onRootLayout} style={{ flex: 1, backgroundColor: c.base, overflow: 'hidden' }}>
        {box ? (
          <DotField
            width={box.w} height={box.h} max={L.fieldMax} wave={calm ? undefined : wave} waveOrigin={center ?? undefined} touch={touch.touch}
            style={{ position: 'absolute', left: 0, top: 0 }}
          />
        ) : null}
        {/* Tap kamkoli = přeskočit na konec; CTA má vlastní Pressable a má přednost. */}
        <Pressable style={{ flex: 1 }} onPress={skipToEnd} accessible={false}>
          <Animated.View style={[{ flex: 1 }, sceneStyle]}>
            {/* Průhledná plocha (ne `Screen`, ten má plnou `base`): pod obsahem musí být vidět pole teček. */}
            <View style={{ flex: 1, paddingTop: insets.top, paddingHorizontal: space.l }}>
              <Animated.View style={[{ paddingTop: short ? space.m : compact ? space.l : space.xl }, textStyle]}>
                <Text variant={short ? 'dotTitleShort' : 'display'} accessibilityRole="header">{title}</Text>
              </Animated.View>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: short ? space.m : compact ? space.l : space.xl }}>
                <View ref={plateRef} onLayout={measure} style={{ width: P, height: P }}>
                  {P > 0 ? (
                    <Animated.View style={plateStyle}>
                      <DotPlate kg={kg} size={P} state="current" decorative rotation={spin} />
                    </Animated.View>
                  ) : null}
                </View>
                {/* Průvodce: místo rezervované od začátku (layout se nehne a let teček míří na správný střed kotouče),
                    viditelný až s CTA. Šipka nahoru ke kotouči. */}
                {guide ? (
                  <View style={{ marginTop: -(tight ? space.s : space.l), alignSelf: 'stretch' }}>
                    <GuideBubble id={guide.id} arrow="up" play={ctaReady} onDismiss={guide.dismiss} />
                  </View>
                ) : null}
                <View style={{ alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: space.m }}>
                  <Animated.View style={mascotStyle}>
                    <Mascot stage={result.stageBefore} cosmetics={cosmetics} mood={mood} size={compact ? 'S' : 'M'} hop={false} scarfEdge={mood === cheer} decorative reaction={mascotReaction} />
                  </Animated.View>
                  <Animated.View style={[{ flex: 1, gap: space.s }, textStyle]}>
                    <View
                      accessible
                      accessibilityLabel={`+${result.xp.total} XP, ${xpBreakdownLabel(result.xp, XP_LABELS)}`}
                      style={{ gap: space.xs }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s }}>
                        <Text variant="dotStat">{`+${xpShown}`}</Text>
                        <Text variant="telemetry" tone="muted">XP</Text>
                      </View>
                      <Text variant="caption" tone="muted" numberOfLines={2}>{xpBreakdownLabel(result.xp, XP_LABELS)}</Text>
                    </View>
                    {result.streak > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}>
                        <DotRow
                          total={total} fraction={seriesLit / total} columns={WEEK}
                          intro={calm ? false : stepOf(tl, 'mascot').at}
                          accessibilityLabel={copy.status.streakA11y(result.streak, true)}
                        />
                        <Text variant="telemetry">{copy.status.streak(seriesLit)}</Text>
                      </View>
                    ) : null}
                  </Animated.View>
                </View>
                {tomorrow && !short ? (
                  <Animated.View style={[{ alignSelf: 'stretch' }, textStyle]}>
                    <Text variant="caption" tone="muted">{tomorrow}</Text>
                  </Animated.View>
                ) : null}
              </View>
            </View>
          </Animated.View>
        </Pressable>
        {/* Tečky v letu a shock prstenec nad obsahem (dotyky propouští). */}
        {box && flight && !calm ? (
          <SkiaGuard>
            <Canvas pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: box.w, height: box.h }}>
              <Group transform={swellTransform} origin={origin}>
                {ink.glow ? (
                  <Points points={flyingPts} mode="points" color={ink.glow} strokeWidth={dotR * 2 * dots.glow.scale} strokeCap="round">
                    <BlurMask blur={dots.glow.blur} style="normal" />
                  </Points>
                ) : null}
                <Points points={flyingPts} mode="points" color={ink.on} strokeWidth={dotR * 2} strokeCap="round" />
              </Group>
              <Group transform={shockTransform} origin={origin} opacity={shockOpacity}>
                <Points points={flight.shock} mode="points" color={ink.on} strokeWidth={dotR * 2} strokeCap="round" />
              </Group>
            </Canvas>
          </SkiaGuard>
        ) : null}
        {/* CTA nastoupí zdola v `lessonDone.ctaAt`; místo je rezervované, layout se nehýbe. Do té doby tap přeskočí. */}
        <Animated.View
          pointerEvents={ctaReady ? 'auto' : 'none'}
          style={[{ paddingHorizontal: space.l, paddingTop: short ? space.s : space.m, paddingBottom: insets.bottom + (short ? space.s : space.m) }, ctaStyle]}
        >
          <PillButton label={t.cta} onPress={onContinue} disabled={!ctaReady} />
          {/* Krátký onboarding: doplnění cílů jako sekundární cesta; [CONTINUE] zůstává jediné plné CTA. */}
          {onSetGoals && short ? (
            <Pressable
              onPress={onSetGoals}
              disabled={!ctaReady}
              accessibilityRole="button"
              accessibilityLabel={copy.setup.setGoals}
              style={{ minHeight: size.hit, alignItems: 'center', justifyContent: 'center' }}
            >
              {({ pressed }) => <Text variant="pill" tone={pressed ? undefined : 'muted'}>{`[${copy.setup.setGoals.toUpperCase()}]`}</Text>}
            </Pressable>
          ) : onSetGoals ? (
            <PillButton label={copy.setup.setGoals} variant="secondary" onPress={onSetGoals} disabled={!ctaReady} style={{ marginTop: space.s }} />
          ) : null}
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
