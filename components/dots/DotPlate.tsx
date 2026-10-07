import { DecorCanvas } from '@/components/dots/DecorCanvas';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { BlurMask, Circle, Group, Points, vec } from '@shopify/react-native-skia';
import { Easing, ReduceMotion, useDerivedValue, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion, useMotionSafe } from '@/lib/motion';
import { dots, stroke, useTheme } from '@/theme';
import { ripplePoints, rotateAround, scanCount, type Pt } from './animate';
import { plateDots, spiralOrder } from './geometry';
import { glowPad, toPoints, useDotInk, type DotTouch } from './ink';
import { SkiaGuard } from './SkiaGuard';

export type DotPlateState = 'locked' | 'current' | 'done';

interface Props {
  kg: number;
  /** Průměr v pt; vnější hrana teček leží přesně na size / 2 (kotva opičky, `plateOuterRadius`). */
  size: number;
  state: DotPlateState;
  /** Číslo kg uprostřed (výchozí ano; dokončený kotouč místo něj nese fajfku, pokud `check`). */
  showKg?: boolean;
  /** Dokončený: fajfka v otvoru (false = PlateNode ji dokreslí animovaně). */
  check?: boolean;
  /** Natočení teček v radiánech (motion-agent: ambientní rotace `motion.plateSpin` + roztočení prstem). */
  rotation?: SharedValue<number>;
  /** Úhel hlavy komety v radiánech vůči kotouči (jen `current`; motion-agent ji nechá obíhat). */
  comet?: SharedValue<number>;
  /** Dotyková vlna (souřadnice v rámci kotouče 0–size); vlna jde v prostoru obrazovky, i když se kotouč točí. */
  touch?: DotTouch;
  /** Dech záře aktuálního kotouče: opacita vrstvy záře 0–1 (motion `breath`); bez ní plná. */
  breath?: SharedValue<number>;
  /** Nástup spirálou (`motion.dotScanMs`): tečky se rozsvítí od 12 hodin zvenku dovnitř. Číslo = zpoždění v ms. */
  intro?: boolean | number;
  /** Kotouč je uvnitř ovládacího prvku s vlastním popiskem (uzel mapy): pro čtečku skrytý. */
  decorative?: boolean;
}

/** Poloměr tečky kotouče průměru `size`. */
export const plateDotRadius = (size: number) => Math.max(dots.plate.rMin, (size / 2) * dots.plate.rFrac);
/** Poloměr vnější hrany kotouče (= size / 2): sem si sedá opička (LessonMap `mascotSpot`). */
export const plateOuterRadius = (size: number) => size / 2;

// Výchozí (statická) poloha komety: 12 hodin. Na vnějším prstenci (48 teček) padne přesně na tečku.
const COMET_HOME = -Math.PI / 2;

/**
 * Kotouč z teček (spec §2.4): soustředné prstence, počet podle kg (2.5 → 2 … 25 → 7), vnitřní na náboji R/φ².
 * - zamčený: jen vnější prstenec `dotDim`, v otvoru zámek `muted`,
 * - aktuální: všechny prstence `text` se září (dark) a jasnější „kometa“ na vnějším prstenci,
 * - dokončený: plný `text` bez záře a bez komety, v otvoru fajfka.
 * Číslo kg stojí rovně (netočí se s tečkami): od průměru `dots.plate.dotoMin` Doto, menší uzly mono štítek
 * (Doto je povolené až od 28 pt a do náboje uzlu 72–88 by se nevešlo).
 */
export function DotPlate({ kg, size, state, showKg = true, check = true, rotation, comet, touch, breath, intro = false, decorative = false }: Props) {
  const { c, size: tokens } = useTheme();
  const ink = useDotInk();
  const dotR = plateDotRadius(size);
  const pad = glowPad(dotR * 2 * dots.plate.cometScale);
  const box = size + pad * 2;
  const mid = box / 2;
  const geo = useMemo(() => {
    const all = plateDots(kg, size / 2 - dotR);
    const ring0 = all.filter((d) => d.ring === 0);
    // Pořadí spirály převedené na pozice ve vrstvách: `outerRank[k]` = pořadí k-té vnější tečky ve spirále.
    const order = spiralOrder(all);
    const rank = new Array<number>(all.length);
    order.forEach((idx, r) => { rank[idx] = r; });
    const outerIdx = all.map((d, i) => (d.ring === 0 ? i : -1)).filter((i) => i >= 0);
    const innerIdx = all.map((d, i) => (d.ring > 0 ? i : -1)).filter((i) => i >= 0);
    return {
      outer: toPoints(ring0, mid, mid) as Pt[],
      inner: toPoints(all.filter((d) => d.ring > 0), mid, mid) as Pt[],
      outerRank: outerIdx.map((i) => rank[i]!),
      innerRank: innerIdx.map((i) => rank[i]!),
      total: all.length,
      ring0Count: ring0.length,
      ring0R: size / 2 - dotR,
    };
  }, [kg, size, dotR, mid]);
  // Natočení celé sady teček a komety; bez shared value stojí (statický vzhled, Reduce Motion).
  const spin = useDerivedValue(() => [{ rotate: rotation ? rotation.value : 0 }]);
  const cometSpin = useDerivedValue(() => [{ rotate: (rotation ? rotation.value : 0) + (comet ? comet.value : COMET_HOME) }]);

  // Nástup spirálou: průběh 0 → 1 za `dotScanMs`; omezený pohyb = celé prolnutí 200 ms (opacita plátna).
  const { reduced } = useMotionSafe();
  const playIntro = intro !== false;
  const introDelay = typeof intro === 'number' ? intro : 0;
  const reveal = useSharedValue(playIntro ? 0 : 1);
  useEffect(() => {
    if (!playIntro) return;
    const cfg = reduced
      ? { ...motion.calmFade, reduceMotion: ReduceMotion.Never }
      : { duration: motion.dotScanMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never };
    reveal.value = withDelay(introDelay, withTiming(1, cfg));
    // Nástup se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const spiral = playIntro && !reduced;
  const canvasOpacity = useDerivedValue(() => (spiral ? 1 : reveal.value));

  // Viditelné tečky (spirála) a dotyková vlna, obojí na UI vlákně. Prst se převede do soustavy otočeného
  // kotouče (−rotation), takže tečky uhýbají od prstu v prostoru obrazovky.
  // Sdílené hodnoty doteku rozbalené mimo worklet (pravidlo no-worklet-object-capture).
  const tS = touch?.strength; const tX = touch?.x; const tY = touch?.y;
  const layers = useDerivedValue(() => {
    let outer: readonly Pt[] = geo.outer;
    let inner: readonly Pt[] = geo.inner;
    if (spiral && reveal.value < 1) {
      const k = scanCount(reveal.value, geo.total).whole;
      outer = geo.outer.filter((_, i) => geo.outerRank[i]! < k);
      inner = geo.inner.filter((_, i) => geo.innerRank[i]! < k);
    }
    const s = tS ? tS.value : 0;
    if (!tX || !tY || s <= 0.001) return { outer, inner, lit: [] as Pt[] };
    const f = rotateAround(tX.value + pad, tY.value + pad, mid, mid, -(rotation ? rotation.value : 0));
    const o = ripplePoints(outer, f.x, f.y, s, motion.ripple.radius, motion.ripple.push);
    const n = ripplePoints(inner, f.x, f.y, s, motion.ripple.radius, motion.ripple.push);
    return { outer: o.pts, inner: n.pts, lit: [...o.lit, ...n.lit] };
  });
  const outerPts = useDerivedValue(() => layers.value.outer as Pt[]);
  const innerPts = useDerivedValue(() => layers.value.inner as Pt[]);
  const allPts = useDerivedValue(() => [...layers.value.outer, ...layers.value.inner]);
  const litPts = useDerivedValue(() => layers.value.lit);
  const litOpacity = useDerivedValue(() => (tS ? tS.value : 0) * motion.ripple.lit);
  const glowOpacity = useDerivedValue(() => (breath ? breath.value : 1));
  const cometOpacity = useDerivedValue(() => (spiral ? Math.max(0, reveal.value * 4 - 3) : 1));

  const locked = state === 'locked';
  const lit = locked ? ink.dim : ink.on;
  const glow = state === 'current' ? ink.glow : null;
  const step = (2 * Math.PI) / geo.ring0Count;
  const tail = Array.from({ length: dots.plate.cometDots }, (_, k) => {
    const t = k / dots.plate.cometDots;
    return { a: -k * step, r: dotR * (dots.plate.cometScale - (dots.plate.cometScale - 1) * t), o: 1 - t };
  });

  const a11y = decorative
    ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
    : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: copy.dots.plateA11y(kg, copy.map.nodeState[state]) };
  const center = locked
    ? <Lock size={tokens.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />
    : state === 'done' && check
      ? <Check size={tokens.lockIcon} color={c.text} strokeWidth={stroke.check} />
      : showKg
        ? <Text variant={size >= dots.plate.dotoMin ? 'dotStat' : 'label'} maxFontSizeMultiplier={1}>{kg}</Text>
        : null;

  return (
    <View {...a11y} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <SkiaGuard fallback={<FallbackRim size={size} locked={locked} />}>
        <DecorCanvas testID="dotplate-canvas" pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: box, height: box }}>
          <Group opacity={canvasOpacity}>
          <Group transform={spin} origin={vec(mid, mid)}>
            {glow ? (
              <Points points={allPts} mode="points" color={glow} opacity={glowOpacity} strokeWidth={dotR * 2 * dots.glow.scale} strokeCap="round">
                <BlurMask blur={dots.glow.blur} style="normal" />
              </Points>
            ) : null}
            <Points points={outerPts} mode="points" color={lit} strokeWidth={dotR * 2} strokeCap="round" />
            {locked ? null : <Points points={innerPts} mode="points" color={lit} strokeWidth={dotR * 2} strokeCap="round" />}
            {touch ? <Points points={litPts} mode="points" color={ink.on} opacity={litOpacity} strokeWidth={dotR * 2} strokeCap="round" /> : null}
          </Group>
          {state === 'current' ? (
            <Group transform={cometSpin} origin={vec(mid, mid)} opacity={cometOpacity}>
              {tail.map((d, k) => (
                <Circle key={k} cx={mid + Math.cos(d.a) * geo.ring0R} cy={mid + Math.sin(d.a) * geo.ring0R} r={d.r} color={ink.on} opacity={d.o}>
                  {k === 0 && glow ? <BlurMask blur={dots.glow.blur / 2} style="solid" /> : null}
                </Circle>
              ))}
            </Group>
          ) : null}
          </Group>
        </DecorCanvas>
      </SkiaGuard>
      {center}
    </View>
  );
}

/** Bez Skia (web bez CanvasKit): vlasový obrys kotouče, ať uzel mapy zůstane čitelný a klepnutelný. */
function FallbackRim({ size, locked }: { size: number; locked: boolean }) {
  const { c, radius } = useTheme();
  return (
    <View
      style={{
        position: 'absolute', width: size, height: size, borderRadius: radius.full,
        borderWidth: stroke.nodeRing, borderColor: locked ? c.dotDim : c.text,
      }}
    />
  );
}
