import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { BigActionBar } from '@/components/ui/BigActionBar';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useOnboardingDraft, usePathOptions } from '@/hooks/useOnboardingDraft';
import { now } from '@/lib/clock';
import { haptics } from '@/lib/haptics';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import { formatCzDate, toISODate } from '@/logic/dates';
import { buildOnboardingInput } from '@/logic/onboarding';
import { services } from '@/services';
import { ThemeProvider, useTheme } from '@/theme';
import type { Mood } from '@/types';

const t = copy.onboarding.birth;

// Časová osa zrození (ms od zobrazení). Kruh se nafoukne po chvíli prázdna, praskne a z jeho
// místa vyskočí opice; pak radost, text a nakonec CTA. Odstupy 450/900/1400/1800 ms se počítají
// od nafouknutí kruhu.
const INFLATE_AT = 300;
const BURST_AT = INFLATE_AT + 450;
const HAPPY_AT = INFLATE_AT + 900;
const TEXT_AT = INFLATE_AT + 1400;
const CTA_AT = INFLATE_AT + 1800;
const BURST_MS = 220;
const BURST_SCALE = 1.15;
// Nádech před prasknutím (UX2, anticipace): kruh se 140 ms stahuje na 0.94, pak praskne.
const TENSE_MS = 140;
const TENSE_SCALE = 0.94;
// Kruh a opice v plné velikosti (Mascot XL); na nízkém displeji se zmenší do volného místa nad textem.
const DISC_MAX = 300;
const DISC_MIN = 160;
const MASCOT_TO_DISC = 280 / DISC_MAX;
const MASCOT_START = { scale: 0.6, y: 40 };
const TEXT_RISE = 12;
// Víc než výška lišty i se spodní safe area: před naběhnutím je celá pod okrajem obrazovky.
const CTA_TRAVEL = 160;
// Omezený pohyb (spec §6.7): místo pružin se konečný stav jen prolne.
const REDUCED_FADE = { duration: 200 };

/** Krok 5: zrození opice. Scéna je vždy tmavá („tmavá plocha, uprostřed puká kruh“, spec §7.1). */
export default function BirthStep() {
  // Zrození nemá hlavičku ani mapu, sezónní neutrály by se nepoužily.
  return (
    <ThemeProvider seasonThemeId={null} forceScheme="dark">
      <BirthScene />
    </ThemeProvider>
  );
}

function BirthScene() {
  const { c, space } = useTheme();
  const { reduced } = useMotionSafe();
  const paths = usePathOptions();
  const resetDraft = useOnboardingDraft((s) => s.reset);
  // Koncept se zachytí při vstupu: po uložení se resetuje a obrazovka nesmí během odchodu problikovat.
  const [input] = useState(() => buildOnboardingInput(useOnboardingDraft.getState()));
  const [bornOn] = useState(() => formatCzDate(toISODate(now())));
  // Sekvence se rozhodne jednou při vstupu; přepnutí omezení pohybu uprostřed ji nerestartuje.
  const [calm] = useState(reduced);
  const [mood, setMood] = useState<Mood>(calm ? 'happy' : 'idle');
  const [ctaReady, setCtaReady] = useState(calm);
  const [failed, setFailed] = useState(false);
  const [stageHeight, setStageHeight] = useState(0);
  const submitting = useRef(false);

  // Oslava je konec onboardingu: hardwarové Zpět na Androidu nesmí vrátit doprostřed formuláře (swipe vypíná _layout).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const circleScale = useSharedValue(0);
  const circleOpacity = useSharedValue(1);
  const holeScale = useSharedValue(0);
  const mascotOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(MASCOT_START.scale);
  const mascotY = useSharedValue(MASCOT_START.y);
  const textOpacity = useSharedValue(0);
  // Lišta vyjede zespodu (0 → 1 = mimo obrazovku → na místě). Nezprůhledňuje se: poloprůhledný akcent by byl nový odstín.
  const ctaIn = useSharedValue(0);

  useEffect(() => {
    if (!input) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => { timers.push(setTimeout(fn, ms)); };

    if (calm) {
      circleOpacity.value = 0;
      mascotScale.value = 1;
      mascotY.value = 0;
      mascotOpacity.value = withTiming(1, REDUCED_FADE);
      textOpacity.value = withTiming(1, REDUCED_FADE);
      ctaIn.value = 1;
      haptics.success();
      return;
    }

    circleScale.value = withDelay(INFLATE_AT, withSpring(1, motion.pop));
    at(BURST_AT - TENSE_MS, () => { circleScale.value = withTiming(TENSE_SCALE, { duration: TENSE_MS, easing: ease.press }); });
    // Prasknutí: kruh se roztáhne a od středu vyprázdní do mizejícího prstence, ze kterého vyskočí opice.
    // Akcent se nezprůhledňuje (ztlumený akcent by byl nový odstín), vyprázdní ho díra v barvě pozadí.
    at(BURST_AT, () => {
      circleScale.value = withTiming(BURST_SCALE, { duration: BURST_MS, easing: ease.punch });
      holeScale.value = withTiming(1, { duration: BURST_MS, easing: ease.punch });
      circleOpacity.value = withDelay(BURST_MS, withTiming(0, { duration: 0 }));
      mascotOpacity.value = 1;
      mascotScale.value = withSpring(1, motion.settle);
      mascotY.value = withSpring(0, motion.settle);
      haptics.success();
    });
    at(HAPPY_AT, () => setMood('happy'));
    textOpacity.value = withDelay(TEXT_AT, withTiming(1, motion.reveal));
    ctaIn.value = withDelay(CTA_AT, withTiming(1, motion.reveal));
    at(CTA_AT, () => setCtaReady(true));
    return () => timers.forEach(clearTimeout);
  }, [input, calm, circleScale, circleOpacity, holeScale, mascotOpacity, mascotScale, mascotY, textOpacity, ctaIn]);

  const circleStyle = useAnimatedStyle(() => ({ opacity: circleOpacity.value, transform: [{ scale: circleScale.value }] }));
  const holeStyle = useAnimatedStyle(() => ({ transform: [{ scale: holeScale.value }] }));
  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ translateY: mascotY.value }, { scale: mascotScale.value }],
  }));
  const textRise = calm ? 0 : TEXT_RISE;
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: (1 - textOpacity.value) * textRise }],
  }));
  const ctaStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - ctaIn.value) * CTA_TRAVEL }] }));

  if (!input) return <Redirect href="/onboarding/path" />;
  const disc = Math.round(Math.min(DISC_MAX, Math.max(DISC_MIN, stageHeight - space.xl - space.l)));
  const onStageLayout = (e: LayoutChangeEvent) => setStageHeight(e.nativeEvent.layout.height);
  const pathName = paths.find((p) => p.id === input.path)?.name ?? '';

  const start = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setFailed(false);
    try {
      await services.user.completeOnboarding(input);
    } catch (e) {
      console.warn('[onboarding] uložení profilu selhalo', e);
      submitting.current = false;
      setFailed(true);
      return;
    }
    resetDraft();
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.base, overflow: 'hidden' }}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Opice stojí nad titulkem (space.xl), ne ve středu volné plochy: scéna a text tvoří jeden blok. */}
        <View onLayout={onStageLayout} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: space.xl }}>
          {stageHeight > 0 ? (
            <View style={{ width: disc, height: disc, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View
                style={[circleStyle, { position: 'absolute', width: disc, height: disc, borderRadius: disc / 2, backgroundColor: c.accent }]}
              >
                <Animated.View style={[holeStyle, { flex: 1, borderRadius: disc / 2, backgroundColor: c.base }]} />
              </Animated.View>
              <Animated.View style={mascotStyle}>
                <Mascot stage={1} cosmetics={{}} mood={mood} size={Math.round(disc * MASCOT_TO_DISC)} />
              </Animated.View>
            </View>
          ) : null}
        </View>
        <Animated.View style={[textStyle, { paddingHorizontal: space.l, paddingBottom: space.xl, gap: space.s }]}>
          <Text variant="display" accessibilityRole="header">{t.title}</Text>
          <Text tone="muted">{t.lead}</Text>
          <Text variant="label" tone="muted" style={{ marginTop: space.m }}>{`${t.bornLabel(bornOn)} · ${pathName}`}</Text>
          {failed ? (
            <Text variant="bodyStrong" accessibilityRole="alert" style={{ color: c.danger, marginTop: space.m }}>{t.saveError}</Text>
          ) : null}
        </Animated.View>
      </SafeAreaView>
      {/* Než CTA naběhne, je skryté i pro čtečky (iOS i TalkBack). */}
      <Animated.View
        style={[ctaStyle, { pointerEvents: ctaReady ? 'auto' : 'none' }]}
        accessibilityElementsHidden={!ctaReady}
        importantForAccessibility={ctaReady ? 'auto' : 'no-hide-descendants'}
      >
        <BigActionBar primary={{ label: failed ? copy.common.retry : t.cta, onPress: () => { void start(); } }} />
      </Animated.View>
    </View>
  );
}
