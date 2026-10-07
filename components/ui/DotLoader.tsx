import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { copy } from '@/data/copy';
import { DOT_GRID, echoBloom, echoDelay, echoOpacity, remapOpacity, ringOf, staticBloomLevel, staticOpacity } from '@/lib/dotLoader';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { Edge } from 'react-native-safe-area-context';
import { StateView } from './StateView';

interface Props {
  /** Strana mřížky v pt; výchozí `size.loader`. */
  size?: number;
  /** Průměr tečky v pt; výchozí `size.loaderDot`. */
  dotSize?: number;
  /** Násobek rychlosti (cyklus = 1500 ms / speed); výchozí 1.25 jako originál. */
  speed?: number;
  /** Záře kolem teček ve špičce vlny. */
  bloom?: boolean;
  opacityBase?: number;
  opacityMid?: number;
  opacityPeak?: number;
  /** Barva teček; výchozí akcent z tématu. */
  color?: string;
  accessibilityLabel?: string;
}

const D = motion.dotLoader;
const COUNT = DOT_GRID * DOT_GRID;
const INDEXES = Array.from({ length: COUNT }, (_, i) => i);
// Poloměr záře v násobcích průměru tečky: vnější drop-shadow originálu (1.35 × 0.9) + půl tečky.
const GLOW_REACH = 0.5 + 1.35 * 0.9;
const clamp01 = (v: number | undefined) => (v == null || !Number.isFinite(v) ? undefined : Math.min(1, Math.max(0, v)));

/**
 * Načítací animace „Echo Ring“: soustředné kosočtvercové vlny přes mřížku 5×5 s ozvěnou v každém kruhu.
 * Jeden sdílený čas (0→1 za cyklus) na UI threadu, každá tečka jen posouvá fázi o zpoždění svého kruhu.
 * Při omezení pohybu statický gradient od středu (0.92 → 0.2).
 */
export function DotLoader({
  size: sizeProp, dotSize: dotProp, speed = D.speed, bloom = false,
  opacityBase, opacityMid, opacityPeak, color, accessibilityLabel = copy.common.loading,
}: Props) {
  const { c, size: tokens } = useTheme();
  const { reduced } = useMotionSafe();
  const size = sizeProp ?? tokens.loader;
  const dotSize = dotProp ?? tokens.loaderDot;
  // R42: načítání není oslava, výchozí barva je `text` (akcent jen v dokončení lekce).
  const fill = color ?? c.text;
  const cycleMs = D.cycleMs / (speed > 0 ? speed : 1);
  const clock = useSharedValue(0);
  const gradientId = `dl${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  useEffect(() => {
    if (reduced) return;
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration: cycleMs, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(clock);
  }, [clock, cycleMs, reduced]);

  // Rozložení jako CSS grid originálu: mezera = max(1, floor((size - 5·dot) / 4)), tečka v levém horním rohu buňky.
  const gap = Math.max(1, Math.floor((size - dotSize * DOT_GRID) / (DOT_GRID - 1)));
  const cell = (size - gap * (DOT_GRID - 1)) / DOT_GRID;
  const ob = clamp01(opacityBase), om = clamp01(opacityMid), op = clamp01(opacityPeak);
  const levels = { base: ob ?? D.opacityBase, mid: om ?? D.opacityMid, peak: op ?? D.opacityPeak };

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ busy: true }}
      style={{ width: size, height: size }}
    >
      {INDEXES.map((i) => {
        const ring = ringOf(i);
        const staticO = remapOpacity(staticOpacity(ring), ob, om, op);
        return (
          <Dot
            key={i}
            left={(i % DOT_GRID) * (cell + gap)}
            top={Math.floor(i / DOT_GRID) * (cell + gap)}
            dotSize={dotSize}
            fill={fill}
            clock={clock}
            delay={echoDelay(ring)}
            levels={levels}
            reduced={reduced}
            staticOpacity={staticO}
            staticBloom={bloom ? staticBloomLevel(staticO) : 0}
            bloom={bloom}
            gradientId={gradientId}
          />
        );
      })}
    </View>
  );
}

interface DotProps {
  left: number; top: number; dotSize: number; fill: string;
  clock: SharedValue<number>; delay: number; levels: { base: number; mid: number; peak: number };
  reduced: boolean; staticOpacity: number; staticBloom: number; bloom: boolean; gradientId: string;
}

function Dot({ left, top, dotSize, fill, clock, delay, levels, reduced, staticOpacity: so, staticBloom, bloom, gradientId }: DotProps) {
  const { base, mid, peak } = levels;
  const dotStyle = useAnimatedStyle(() => ({
    opacity: reduced ? so : echoOpacity(clock.value - delay, base, mid, peak),
  }));
  // drop-shadow v CSS dědí opacitu prvku: záře = opacita tečky × (úroveň záře / 0.9).
  const glowStyle = useAnimatedStyle(() => {
    if (!bloom) return { opacity: 0 };
    if (reduced) return { opacity: so * staticBloom };
    const phase = clock.value - delay;
    return { opacity: echoOpacity(phase, base, mid, peak) * (echoBloom(phase) / 0.9) };
  });
  const reach = dotSize * GLOW_REACH;
  const core = dotSize / 2 / reach;
  return (
    <>
      {bloom && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: left + dotSize / 2 - reach, top: top + dotSize / 2 - reach, width: reach * 2, height: reach * 2 }, glowStyle]}
        >
          <Svg aria-hidden width={reach * 2} height={reach * 2}>
            <Defs>
              <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                <Stop offset={0} stopColor={fill} stopOpacity={1} />
                <Stop offset={core} stopColor={fill} stopOpacity={0.55} />
                <Stop offset={1} stopColor={fill} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={reach} cy={reach} r={reach} fill={`url(#${gradientId})`} />
          </Svg>
        </Animated.View>
      )}
      <Animated.View
        style={[{ position: 'absolute', left, top, width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: fill }, dotStyle]}
      />
    </>
  );
}

/** Celoplošný stav načítání (elite fáze 4): tečkový skeleton `StateView` po krátkém zpoždění, ne spinner. */
export function DotLoaderScreen({ edges }: { edges?: readonly Edge[] } = {}) {
  return <StateView kind="loading" edges={edges} />;
}
