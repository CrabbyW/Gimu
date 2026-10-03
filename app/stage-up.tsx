import { router, useLocalSearchParams } from 'expo-router';
import { markNavigation } from '@/lib/navGuard';
import { useEffect, useState, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mascot, MASCOT_SIZES } from '@/components/mascot';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { haptics } from '@/lib/haptics';
import { ease, motion, stageUp, useMotionSafe } from '@/lib/motion';
import { parseStageParam } from '@/logic/mascot';
import { useTheme } from '@/theme';
import type { CosmeticSlot, MascotStage } from '@/types';

const NO_COSMETICS: Partial<Record<CosmeticSlot, string>> = {};
const XL = MASCOT_SIZES.XL;
// Sekvence §7.4 / plán B Task 26 Step 3 (ms od zobrazení): `stageUp` v lib/motion.
const T = stageUp;
const SHRUNK = T.shrunk;
const RING_R = (XL / 2) * SHRUNK;
const SHARDS = 8;
const SHARD_TRAVEL = XL / 2;
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
  return <View style={{ flex: 1, backgroundColor: c.accent }} />;
}

/**
 * Stage-up (§7.4): celá plocha v akcentu (§6.8 výjimka, oslava = povolený akcent, R43 IWF červená). Stará opice se smrští
 * do kruhu, kruh praskne, vyskočí nová stage v celebrate. Opice uprostřed (výjimka pro maskota),
 * štítek a titulek pod ní vlevo jako popisek exponátu. Inkoust všude `onAccent`.
 */
function StageUpScene({ from, to, unlocked }: { from: MascotStage; to: MascotStage; unlocked: string | undefined }) {
  const { c, space, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  const { reduced: reducedNow } = useMotionSafe();
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [reduced] = useState(reducedNow);
  const profile = useProfile();
  const cosmetics = profile.status === 'ready' ? profile.data?.equipped ?? NO_COSMETICS : NO_COSMETICS;
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const oldScale = useSharedValue(1);
  const oldOpacity = useSharedValue(reduced ? 0 : 1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const burst = useSharedValue(0);
  const newScale = useSharedValue(reduced ? 1 : 0);
  const newOpacity = useSharedValue(reduced ? 0 : 1);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduced) {
      // Omezený pohyb: rovnou nová opice (fade 200 ms), haptika zůstává.
      newOpacity.set(withTiming(1, FADE));
      textOpacity.set(withTiming(1, FADE));
      haptics.success();
    } else {
      // 1) Smrštění staré opice do kruhu (ease-out, bez pružiny: je to příprava, ne odměna).
      // 2) Kruh se objeví se smrštěním, před prasknutím se nadechne spolu s opicí (anticipace jako
      //    u zrození), při prasknutí se rozepne 1 → 1.4 a zmizí.
      ringOpacity.set(withDelay(T.shrinkAt, withSequence(
        withTiming(1, motion.ui),
        withDelay(T.burstAt - T.shrinkAt - motion.ui.duration, withTiming(0, { duration: T.burstMs, easing: ease.out })),
      )));
      ringScale.set(withDelay(T.burstAt - T.tenseMs, withSequence(
        withTiming(T.tense, { duration: T.tenseMs, easing: ease.press }),
        withTiming(T.ringTo, { duration: T.burstMs, easing: ease.punch }),
      )));
      // 1) Smrštění staré opice do kruhu (ease-out, bez pružiny: příprava, ne odměna) a nádech.
      oldScale.set(withDelay(T.shrinkAt, withSequence(
        withTiming(SHRUNK, { duration: T.shrinkMs, easing: motion.reveal.easing }),
        withDelay(T.burstAt - T.shrinkAt - T.shrinkMs - T.tenseMs, withTiming(SHRUNK * T.tense, { duration: T.tenseMs, easing: ease.press })),
      )));
      // 3) Prasknutí: stará opice zmizí, úlomky letí radiálně ven, nová opice vyskočí pružinou (odměna).
      oldOpacity.set(withDelay(T.burstAt, withTiming(0, { duration: T.oldOutMs })));
      burst.set(withDelay(T.burstAt, withTiming(1, { duration: T.burstMs, easing: ease.punch })));
      newScale.set(withDelay(T.bornAt, withSpring(1, motion.pop)));
      timers.push(setTimeout(() => haptics.success(), T.bornAt));
      textOpacity.set(withDelay(T.textAt, withTiming(1, motion.ui)));
    }
    timers.push(setTimeout(() => setReady(true), T.ctaAt));
    return () => timers.forEach(clearTimeout);
  }, [reduced, oldScale, oldOpacity, ringOpacity, ringScale, burst, newScale, newOpacity, textOpacity]);

  const oldStyle = useAnimatedStyle(() => ({ opacity: oldOpacity.value, transform: [{ scale: oldScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: ringOpacity.value, transform: [{ scale: ringScale.value }] }));
  const newStyle = useAnimatedStyle(() => ({ opacity: newOpacity.value, transform: [{ scale: newScale.value }] }));
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

  const center = { position: 'absolute', left: 0, top: 0, width: XL, height: XL, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flex: 1, backgroundColor: c.accent, paddingTop: insets.top }} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.l, gap: space.xl }}>
        <View style={{ width: XL, height: XL, alignSelf: 'center' }} accessible accessibilityLabel={copy.stageUp.a11y(to, name)}>
          {reduced ? null : (
            <Animated.View style={[center, oldStyle]}>
              <Mascot stage={from} mood="idle" size="XL" cosmetics={cosmetics} />
            </Animated.View>
          )}
          {reduced ? null : (
            <Animated.View pointerEvents="none" style={[center, ringStyle]}>
              <View style={{ width: RING_R * 2, height: RING_R * 2, borderRadius: RING_R, borderWidth: stroke.focus, borderColor: c.onAccent }} />
            </Animated.View>
          )}
          {reduced ? null : Array.from({ length: SHARDS }, (_, k) => <Shard key={k} index={k} burst={burst} />)}
          <Animated.View style={[center, newStyle]}>
            <Mascot stage={to} mood="celebrate" size="XL" cosmetics={cosmetics} />
          </Animated.View>
        </View>
        <Animated.View style={[{ gap: space.s }, textStyle]}>
          <Text variant="label" tone="onAccent">{copy.stageUp.label(to, name)}</Text>
          <Text variant="display" tone="onAccent" accessibilityRole="header">{copy.stageUp.title}</Text>
        </Animated.View>
      </View>
      <BigActionBar primary={{ label: copy.stageUp.cta, onPress: onContinue, disabled: !ready || leaving, onAccent: true }} />
    </View>
  );
}

/** Úlomek prasknutého kruhu: z obvodu kruhu letí radiálně ven a mizí. */
function Shard({ index, burst }: { index: number; burst: SharedValue<number> }) {
  const { c, size, radius } = useTheme();
  const angle = (index / SHARDS) * Math.PI * 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const style = useAnimatedStyle(() => {
    const p = burst.value;
    const d = RING_R + p * SHARD_TRAVEL;
    return { opacity: p > 0 ? 1 - p : 0, transform: [{ translateX: dx * d }, { translateY: dy * d }] };
  });
  const s = size.shard;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: XL / 2 - s / 2, top: XL / 2 - s / 2, width: s, height: s, borderRadius: radius.full, backgroundColor: c.onAccent }, style]}
    />
  );
}
