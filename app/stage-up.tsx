import { DecorCanvas } from '@/components/dots/DecorCanvas';
import { router, useLocalSearchParams } from 'expo-router';
import { markNavigation } from '@/lib/navGuard';
import { useEffect, useMemo, useState, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { Group, Points, vec } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotRing, ringLayout, SkiaGuard } from '@/components/dots';
import { rowLit } from '@/components/dots/geometry';
import { Mascot, MASCOT_SIZES, useMascotAct } from '@/components/mascot';
import { PRIO } from '@/lib/mascotAct';
import { eventToRepertoire } from '@/logic/mascotRepertoire';
import { poseForAppState } from '@/logic/mascotPoses';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { haptics } from '@/lib/haptics';
import { feedback } from '@/lib/feedback';
import { ease, motion, stageUp, useMotionSafe } from '@/lib/motion';
import { parseStageParam } from '@/logic/mascot';
import { dots, useTheme } from '@/theme';
import type { CosmeticSlot, MascotStage } from '@/types';
import { ReactiveBackground } from '@/components/dots/ReactiveBackground';

const NO_COSMETICS: Partial<Record<CosmeticSlot, string>> = {};
/** Plocha scény = prstenec stage (Nothing Dot fáze 2); opička M sedí na jeho spodní hraně. */
const BOX = dots.stageUp.ring;
const MASCOT = MASCOT_SIZES.M;
const MASCOT_DROP = MASCOT * dots.stageUp.mascotDrop;
/** Počet stage opice (BABY · TEENAGER · ALPHA): prstenec se rozsvítí do stage / STAGES. */
const STAGES = Object.keys(copy.stageUp.names).length;
// Sekvence §7.4 / plán B Task 26 Step 3 (ms od zobrazení): `stageUp` v lib/motion.
const T = stageUp;
const FADE = motion.calmFade;

/** Na mapu (stejně jako „Pokračovat“ z oslavy lekce), s id odemčeného uzlu pro unlock sekvenci. */
function toMap(unlocked: string | undefined) {
  router.dismissTo({ pathname: '/(tabs)', params: unlocked ? { unlocked } : {} });
}

export default function StageUpScreen() {
  const params = useLocalSearchParams<{ from?: string; to?: string; unlocked?: string }>();
  const from = parseStageParam(params.from);
  const to = parseStageParam(params.to);
  const unlocked = typeof params.unlocked === 'string' && params.unlocked !== '' ? params.unlocked : undefined;
  const valid = from !== null && to !== null && to >= 2 && to > from;

  // Neplatné parametry (deep link, poškozená navigace): žádný pád, rovnou na mapu.
  useEffect(() => { if (!valid) toMap(unlocked); }, [valid, unlocked]);

  if (!valid) return <BlankAccent />;
  return <StageUpScene from={from} to={to} unlocked={unlocked} />;
}

function BlankAccent() {
  const { c } = useTheme();
  return <View style={{ flex: 1, backgroundColor: c.seasonGold }} />;
}

/**
 * Stage-up (Nothing Dot fáze 2): celá plocha `seasonGold` (spec §2.1, jediná plošná výjimka z monochromu).
 * Uprostřed tečkový prstenec stage s Doto `displayXL` číslem, na jeho spodní hraně sedí opička v celebrate.
 * Starý stage: opička se stáhne, prstenec se rozpadne na tečky, které přeletí do nového (`RingShatter`). Štítek a titulek vlevo pod scénou jako
 * popisek exponátu, inkoust `onSeasonGold`. Omezený pohyb: rovnou finální stav, fade 200 ms. 3 plátna.
 */
function StageUpScene({ from, to, unlocked }: { from: MascotStage; to: MascotStage; unlocked: string | undefined }) {
  const { c, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { reduced: reducedNow } = useMotionSafe();
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [reduced] = useState(reducedNow);
  const profile = useProfile();
  const cosmetics = profile.status === 'ready' ? profile.data?.equipped ?? NO_COSMETICS : NO_COSMETICS;
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const oldScale = useSharedValue(1);
  const oldMascot = useSharedValue(1);
  const oldOpacity = useSharedValue(reduced ? 0 : 1);
  const shatter = useSharedValue(0);
  const dotsOpacity = useSharedValue(0);
  const newScale = useSharedValue(reduced ? 1 : 0);
  const newRing = useSharedValue(reduced ? 1 : 0);
  const newOpacity = useSharedValue(reduced ? 0 : 1);
  const textOpacity = useSharedValue(0);
  // Repertoár: nová opička po zrodu povyroste a tečky kolem ní rostou (`grow`). Haptiku nese podpis `stageUp`.
  const acts = useMascotAct();
  const playRef = useRef(acts.play);
  useEffect(() => { playRef.current = acts.play; });
  const playAct: typeof acts.play = (...a) => playRef.current(...a);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduced) {
      // Omezený pohyb: rovnou nová opice (fade 200 ms), haptika zůstává.
      newOpacity.set(withTiming(1, FADE));
      textOpacity.set(withTiming(1, FADE));
      feedback('stageUp');
      const g = eventToRepertoire({ type: 'stageUp' });
      if (g) playAct(g, PRIO.moment, { haptic: false });
    } else {
      // 1) Stará opička se stáhne a zmizí (příprava, ease-out, bez pružiny); prstenec se nadechne.
      oldMascot.set(withDelay(T.shrinkAt, withTiming(0, { duration: T.shrinkMs, easing: motion.reveal.easing })));
      oldScale.set(withDelay(T.shatterAt - T.tenseMs, withTiming(T.tense, { duration: T.tenseMs, easing: ease.press })));
      // 2) Rozpad: tečky převezmou vnitřní prstenec na stejných místech, starý rastr se rozplyne.
      dotsOpacity.set(withDelay(T.shatterAt, withSequence(
        withTiming(1, motion.instant),
        withDelay(T.shatterMs - motion.instant.duration, withTiming(0, { duration: T.handoffMs })),
      )));
      oldOpacity.set(withDelay(T.shatterAt, withTiming(0, { duration: T.oldOutMs })));
      shatter.set(withDelay(T.shatterAt, withTiming(1, { duration: T.shatterMs, easing: Easing.linear })));
      timers.push(setTimeout(() => haptics.tick(), T.shatterAt));
      // 3) Dolet: nový prstenec převezme tečky, opička vyskočí pružinou (odměna).
      newRing.set(withDelay(T.bornAt, withTiming(1, { duration: T.handoffMs })));
      newScale.set(withDelay(T.bornAt, withSpring(1, motion.pop)));
      timers.push(setTimeout(() => feedback('stageUp'), T.bornAt));
      timers.push(setTimeout(() => { const g = eventToRepertoire({ type: 'stageUp' }); if (g) playAct(g, PRIO.moment, { haptic: false }); }, T.bornAt));
      textOpacity.set(withDelay(T.textAt, withTiming(1, motion.ui)));
    }
    timers.push(setTimeout(() => setReady(true), reduced ? FADE.duration : T.ctaAt));
    return () => timers.forEach(clearTimeout);
  }, [reduced, oldScale, oldMascot, oldOpacity, shatter, dotsOpacity, newScale, newRing, newOpacity, textOpacity]);

  const oldStyle = useAnimatedStyle(() => ({ opacity: oldOpacity.value, transform: [{ scale: oldScale.value }] }));
  const oldMascotStyle = useAnimatedStyle(() => ({ opacity: oldMascot.value, transform: [{ scale: T.shrunk + (1 - T.shrunk) * oldMascot.value }] }));
  const newStyle = useAnimatedStyle(() => ({ opacity: newOpacity.value }));
  const newRingStyle = useAnimatedStyle(() => ({ opacity: newRing.value }));
  const newMascotStyle = useAnimatedStyle(() => ({ transform: [{ scale: newScale.value }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  const name = copy.stageUp.names[to];
  // Ref, ne jen stav: dva tapy ve stejném snímku by oba prošly, než se `leaving` překreslí (QA demo f4, bug 1).
  const left = useRef(false);
  const onContinue = () => {
    if (!ready || leaving || left.current) return;
    left.current = true;
    markNavigation();
    setLeaving(true);
    toMap(unlocked);
  };

  const center = { position: 'absolute', left: 0, top: 0, width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' } as const;
  const ink = { color: c.onSeasonGold };
  return (
    <ReactiveBackground tone="gold" style={{ backgroundColor: c.seasonGold, paddingTop: insets.top }} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.l, gap: space.xl }}>
        <View style={{ width: BOX, height: BOX + MASCOT_DROP, alignSelf: 'center' }} accessible accessibilityLabel={copy.stageUp.a11y(to, name)}>
          {/* Starý stage: tečkový prstenec rozsvícený do from/3 s Doto číslem a opičkou. Motion ho smrští
              a „rozpadne“ (úlomky = tečky), pak nastoupí nový. */}
          {reduced ? null : (
            <Animated.View style={[center, oldStyle]}>
              <StageRing stage={from} />
            </Animated.View>
          )}
          {reduced ? null : (
            <Animated.View style={[center, oldMascotStyle]}>
              <View style={{ position: 'absolute', bottom: -MASCOT_DROP }}>
                <Mascot stage={from} mood="idle" size={MASCOT} cosmetics={cosmetics} decorative />
              </View>
            </Animated.View>
          )}
          {reduced ? null : <RingShatter from={from} to={to} progress={shatter} opacity={dotsOpacity} />}
          <Animated.View style={[center, newStyle]}>
            <Animated.View style={[center, newRingStyle]}><StageRing stage={to} /></Animated.View>
            {/* Opička sedí na spodní hraně prstence (jako na kotouči mapy): jediný barevný subjekt. */}
            <Animated.View style={[{ position: 'absolute', bottom: -MASCOT_DROP }, newMascotStyle]}>
              <Mascot stage={to} mood="celebrate" pose={poseForAppState('stageUp')} size={MASCOT} cosmetics={cosmetics} decorative act={acts.act} />
            </Animated.View>
          </Animated.View>
        </View>
        <Animated.View style={[{ gap: space.s }, textStyle]}>
          <Text variant="label" style={ink}>{copy.stageUp.label(to, name)}</Text>
          <Text variant="display" style={ink} accessibilityRole="header">{copy.stageUp.title}</Text>
        </Animated.View>
      </View>
      <BigActionBar primary={{ label: copy.stageUp.cta, onPress: onContinue, disabled: !ready || leaving, onGold: true }} />
    </ReactiveBackground>
  );
}

/** Prstenec stage (Nothing Dot fáze 2): `DotRing` na zlaté ploše, rozsvícený do stage / 3 (BABY 1/3 … ALPHA 3/3),
 *  uprostřed číslo stage Doto `displayXL` v `onSeasonGold`. Statický: nástup a rozpad řídí scéna. */
function StageRing({ stage }: { stage: MascotStage }) {
  const { c } = useTheme();
  return (
    <DotRing progress={stage / STAGES} size={BOX} intro={false} onGold>
      <Text variant="displayXL" maxFontSizeMultiplier={1} style={{ color: c.onSeasonGold }} importantForAccessibility="no">{stage}</Text>
    </DotRing>
  );
}

/**
 * Rozpad prstence (motion-agent): tečky vnitřního prstence starého stage vyletí po oblouku ven, pootočí se
 * o jednu třetinu kruhu (= 1 stage) a dosednou na místa nového prstence. Rozsvícení se při doletu přepne
 * ze `from / 3` na `to / 3`. Jedno plátno, pozice počítá worklet na UI vlákně.
 */
function RingShatter({ from, to, progress, opacity }: { from: MascotStage; to: MascotStage; progress: SharedValue<number>; opacity: SharedValue<number> }) {
  const { c } = useTheme();
  const geo = useMemo(() => {
    const L = ringLayout(BOX);
    const n = L.inner.length;
    const r = Math.hypot(L.inner[0]!.x, L.inner[0]!.y);
    // Posun o tolik pozic, kolik odpovídá rozdílu stage: dosednutí padne přesně do mřížky nového prstence.
    const shift = Math.round(n / STAGES) * Math.max(1, to - from);
    const fromLit = rowLit(n, from / STAGES).filter(Boolean).length;
    const toLit = rowLit(n, to / STAGES).filter(Boolean).length;
    // Deterministický rozptyl výletu (bez Math.random: stejný průběh při každém přehrání).
    const amp = Array.from({ length: n }, (_, i) => 1 + T.jitter * Math.sin(i * 12.9898));
    return { n, r, shift, fromLit, toLit, amp, d: L.innerDot * 2 };
  }, [from, to]);
  const pts = useDerivedValue(() => {
    const { n, r, shift, fromLit, toLit, amp } = geo;
    const p = progress.value;
    const lit = [];
    const off = [];
    for (let i = 0; i < n; i++) {
      const raw = Math.min(1, Math.max(0, (p - (T.spread * i) / n) / (1 - T.spread)));
      // easeInOutCubic: odlep, let, dosednutí.
      const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
      const a = -Math.PI / 2 + ((i + shift * t) / n) * Math.PI * 2;
      const rr = r * (T.tense + (1 - T.tense) * t) * (1 + T.burst * amp[i]! * Math.sin(Math.PI * t));
      const pt = vec(BOX / 2 + Math.cos(a) * rr, BOX / 2 + Math.sin(a) * rr);
      const on = t < 0.5 ? i < fromLit : (i + shift) % n < toLit;
      if (on) lit.push(pt); else off.push(pt);
    }
    return { lit, off };
  });
  const lit = useDerivedValue(() => pts.value.lit);
  const off = useDerivedValue(() => pts.value.off);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: BOX, height: BOX }}>
      <SkiaGuard style={{ width: BOX, height: BOX }}>
        <DecorCanvas style={{ width: BOX, height: BOX }}>
          <Group opacity={opacity}>
            <Points points={off} mode="points" color={c.goldDotOff} strokeWidth={geo.d} strokeCap="round" />
            <Points points={lit} mode="points" color={c.onSeasonGold} strokeWidth={geo.d} strokeCap="round" />
          </Group>
        </DecorCanvas>
      </SkiaGuard>
    </View>
  );
}
