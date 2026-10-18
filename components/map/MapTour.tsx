import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { Mascot } from '@/components/mascot';
import { DotSteps } from '@/components/ui/DotSteps';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { dur, ease, useMotionSafe } from '@/lib/motion';
import { controlsAt, mascotSide, nextTourStep, spotlightRect, tourPlacement, type TourRect, type TourStepId } from '@/logic/mapTour';
import { dots, useTheme } from '@/theme';
import type { CosmeticSlot, MascotStage, Mood } from '@/types';

export interface TourStep {
  id: TourStepId;
  /** Jedna krátká věta opičky (copy.mapTour). */
  text: string;
  /** Změří cíl v souřadnicích okna; null = cíl nejde změřit (krok se ukáže bez výřezu, uprostřed). */
  measure(): Promise<TourRect | null>;
}

interface Props {
  steps: readonly TourStep[];
  stage: MascotStage;
  cosmetics: Partial<Record<CosmeticSlot, string>>;
  mood: Mood;
  /** Konec prohlídky (poslední krok nebo SKIP): volající zapíše „viděno“ a odmontuje. */
  onFinish(): void;
}

const NEVER = { reduceMotion: ReduceMotion.Never };

/**
 * Prohlídka mapy „Opička ukazuje“: mapa ztlumená `scrim`, svítí jen jeden prvek ve výřezu s tečkovým obrysem
 * (Nothing Dot, žádná čára ani akcent). Opička (jediná barva na obrazovce) dosedne k výřezu, pod ní dlaždice
 * s jednou větou. Ťuknutí kamkoli = další krok; [SKIP] a tečky kroku drží roh, který výřez nezabírá.
 * Modal: překryje i tab bar, takže prohlídku nejde „utéct“ do jiného tabu napůl.
 */
export function MapTour({ steps, stage, cosmetics, mood, onFinish }: Props) {
  const { c, space, size, radius } = useTheme();
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { reduced } = useMotionSafe();
  const [index, setIndex] = useState(0);
  // undefined = měří se (nic nekreslit), null = bez výřezu.
  const [hole, setHole] = useState<TourRect | null | undefined>(undefined);
  const done = useRef(false);
  const step = steps[index];

  // Měření cíle: první krok počká, až mapa dojede úvodní sled (dur.reveal); každý krok se ještě jednou
  // přeměří po `dur.standard` (dojezd scrollu / layoutu), ať výřez sedí přesně.
  useEffect(() => {
    if (!step) return;
    let alive = true;
    const run = () => step.measure().then((r) => { if (alive) setHole(r ? spotlightRect(r, space.s, W, H, space.xs) : null); });
    const first = setTimeout(run, index === 0 ? dur.reveal : 0);
    const again = setTimeout(run, (index === 0 ? dur.reveal : 0) + dur.standard);
    return () => { alive = false; clearTimeout(first); clearTimeout(again); };
  }, [step, index, space.s, space.xs, W, H]);

  // Nástup kroku: opička s větou dosedne o `space.s` k výřezu; omezený pohyb = jen prolnutí.
  const shown = hole !== undefined;
  const placement = hole ? tourPlacement(hole, H) : 'below';
  const fade = useSharedValue(0);
  const rise = useSharedValue(0);
  const scrimIn = useSharedValue(0);
  useEffect(() => {
    if (!shown) return;
    scrimIn.value = withTiming(1, { duration: dur.enter, easing: ease.out, ...NEVER });
    fade.value = 0;
    fade.value = withTiming(1, { duration: dur.enter, easing: ease.out, ...NEVER });
    rise.value = reduced ? 0 : (placement === 'below' ? -space.s : space.s);
    rise.value = withTiming(0, { duration: dur.enter, easing: ease.out, ...NEVER });
  }, [shown, index, reduced, placement, space.s, fade, rise, scrimIn]);
  const groupStyle = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateY: rise.value }] }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: scrimIn.value }));

  // VoiceOver: každý krok ohlásit celou větou s pořadím.
  useEffect(() => {
    if (!shown || !step) return;
    AccessibilityInfo.announceForAccessibility(copy.mapTour.stepA11y(index + 1, steps.length, step.text));
  }, [shown, step, index, steps.length]);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onFinish();
  };
  const advance = () => {
    const next = nextTourStep(index, steps.length);
    if (next === null) { finish(); return; }
    feedback('cta');
    setHole(undefined);
    setIndex(next);
  };

  if (!step) return null;
  const top = insets.top + space.s;
  const bottomBand = insets.bottom + space.m + size.hit;
  const controls = hole ? controlsAt(hole, H, bottomBand) : 'bottom';
  const m = size.tourMascot;
  // Malý cíl (kotouč): opička sedí vedle něj a bublina pod/nad ním; jinak opička nad bublinou u cíle.
  const side = hole ? mascotSide(hole, W, m + space.l + space.s) : null;
  const cx = hole ? hole.x + hole.width / 2 : W / 2;
  const mascotLeft = Math.min(W - space.l - m, Math.max(space.l, cx - m / 2));
  const r = radius.l;
  // Scrim s výřezem: vnější obdélník + zaoblený výřez, `evenodd` vyřízne díru (jedna plocha, žádné švy).
  const holePath = hole
    ? `M0 0H${W}V${H}H0Z M${hole.x + r} ${hole.y}H${hole.x + hole.width - r}A${r} ${r} 0 0 1 ${hole.x + hole.width} ${hole.y + r}`
      + `V${hole.y + hole.height - r}A${r} ${r} 0 0 1 ${hole.x + hole.width - r} ${hole.y + hole.height}H${hole.x + r}`
      + `A${r} ${r} 0 0 1 ${hole.x} ${hole.y + hole.height - r}V${hole.y + r}A${r} ${r} 0 0 1 ${hole.x + r} ${hole.y}Z`
    : `M0 0H${W}V${H}H0Z`;
  const dotStep = dots.guide.d + dots.guide.gap;

  const sideMascot = hole && side ? (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[{
        position: 'absolute', width: m, height: m, top: hole.y + hole.height / 2 - m / 2,
        left: side === 'right' ? hole.x + hole.width + space.s : hole.x - space.s - m,
      }, groupStyle]}
    >
      <Mascot stage={stage} cosmetics={cosmetics} mood={mood} size={m} decorative />
    </Animated.View>
  ) : null;
  const mascot = side ? null : (
    <View style={{ marginLeft: mascotLeft - space.l, width: m, height: m }}>
      <Mascot stage={stage} cosmetics={cosmetics} mood={mood} size={m} decorative />
    </View>
  );
  const bubble = (
    <View
      style={{
        alignSelf: 'stretch', minHeight: size.hit, gap: space.xs, paddingHorizontal: space.m, paddingVertical: space.s,
        backgroundColor: c.tilePressed, borderRadius: radius.l, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
      }}
    >
      <Text variant="label" tone="muted">{copy.guide.kicker}</Text>
      <Text>{step.text}</Text>
    </View>
  );
  const groupPos = !hole
    ? { top: H / 2 - m }
    : placement === 'below' ? { top: hole.y + hole.height + space.s } : { bottom: H - hole.y + space.s };

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={finish}>
      <Pressable
        testID="map-tour"
        onPress={advance}
        accessibilityRole="button"
        accessibilityLabel={copy.mapTour.stepA11y(index + 1, steps.length, step.text)}
        accessibilityHint={copy.mapTour.nextHint}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, scrimStyle]}>
          <Svg width={W} height={H}>
            <Path d={holePath} fill={c.scrim} fillRule="evenodd" />
            {hole ? (
              // Tečkový obrys výřezu: nulové čárky s kulatým koncem = řada teček (jazyk Nothing Dot).
              <Rect
                x={hole.x} y={hole.y} width={hole.width} height={hole.height} rx={r} ry={r}
                fill="none" stroke={c.text} strokeWidth={dots.guide.d / 2} strokeLinecap="round"
                strokeDasharray={`0 ${dotStep}`}
              />
            ) : null}
          </Svg>
        </Animated.View>
        {shown ? (
          <Animated.View
            pointerEvents="none"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={[{ position: 'absolute', left: space.l, right: space.l, gap: space.xs }, groupPos, groupStyle]}
          >
            {placement === 'below' ? <>{mascot}{bubble}</> : <>{bubble}{mascot}</>}
          </Animated.View>
        ) : null}
        {shown ? sideMascot : null}
      </Pressable>
      <View
        pointerEvents="box-none"
        style={[
          { position: 'absolute', left: space.l, right: space.s, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
          controls === 'top' ? { top } : { bottom: insets.bottom + space.m },
        ]}
      >
        <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden pointerEvents="none">
          <DotSteps total={steps.length} current={index} />
        </View>
        <Pressable
          testID="map-tour-skip"
          onPress={finish}
          accessibilityRole="button"
          accessibilityLabel={copy.mapTour.skipA11y}
          hitSlop={space.xs}
          style={({ pressed }) => ({
            minHeight: size.hit, minWidth: size.hit, paddingHorizontal: space.m, justifyContent: 'center', alignItems: 'center',
            borderRadius: radius.full, backgroundColor: pressed ? c.tilePressed : 'transparent',
          })}
        >
          <Text variant="pill">{`[${copy.mapTour.skip.toUpperCase()}]`}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
