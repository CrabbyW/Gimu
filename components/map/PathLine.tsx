import { useEffect, useId } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Mask, Path } from 'react-native-svg';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import { segmentLength, segmentPath, type NodePosition } from './geometry';

type Point = { x: number; y: number };
const EDGE_GAP = 6;
const bottomOf = (p: NodePosition): Point => ({ x: p.x, y: p.y + p.size / 2 + EDGE_GAP });
const topOf = (p: NodePosition): Point => ({ x: p.x, y: p.y - p.size / 2 - EDGE_GAP });
const AnimatedPath = Animated.createAnimatedComponent(Path);
const DRAW_MS = 420;
const DOTS = { strokeWidth: 3, strokeDasharray: '2 10', strokeLinecap: 'round' as const, fill: 'none' };

interface Props {
  width: number;
  height: number;
  positions: NodePosition[];
  /** Úsek i vede z uzlu i do i+1; true = cíl už není zamčený (prošlá cesta, `muted`). */
  reached: boolean[];
  /** Index úseku, který se právě dokresluje (odemykací sekvence). */
  drawing?: number | null;
}

/** Tečkovaná cesta mezi uzly. Prošlé úseky v `muted`, cesta k zamčeným v `mapRule`. */
export function PathLine({ width, height, positions, reached, drawing = null }: Props) {
  const { c, seasonal } = useTheme();
  // Úsek vede od spodní hrany uzlu k horní hraně dalšího: čára nikdy nekříží kotouč ani text bosse.
  const segments = positions.slice(1).map((b, i) => ({ i, a: bottomOf(positions[i]!), b: topOf(b) }));
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {segments.map(({ i, a, b }) => (
        <Path key={i} d={segmentPath(a, b)} stroke={reached[i] && drawing !== i ? c.muted : seasonal.mapRule} {...DOTS} />
      ))}
      {drawing !== null && segments[drawing] ? <DrawingSegment a={segments[drawing].a} b={segments[drawing].b} /> : null}
    </Svg>
  );
}

/** Úsek se „dokreslí“: maska s plnou čarou odhaluje tečky v `muted` od horního uzlu dolů. */
function DrawingSegment({ a, b }: { a: Point; b: Point }) {
  const { c } = useTheme();
  const { reduced } = useMotionSafe();
  const mask = `path-draw-${useId().replace(/[^\w-]/g, '')}`;
  const d = segmentPath(a, b);
  const len = segmentLength(a, b);
  const offset = useSharedValue(reduced ? 0 : len);
  useEffect(() => {
    if (!reduced) offset.value = withTiming(0, { duration: DRAW_MS, easing: motion.reveal.easing });
  }, [len, offset, reduced]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <>
      <Defs>
        <Mask id={mask} maskUnits="userSpaceOnUse">
          {/* Bílá v masce = viditelné; není to barva v UI, jen kanál masky. */}
          <AnimatedPath d={d} stroke="white" strokeWidth={8} fill="none" strokeDasharray={`${len} ${len}`} animatedProps={props} />
        </Mask>
      </Defs>
      <Path d={d} stroke={c.muted} mask={`url(#${mask})`} {...DOTS} />
    </>
  );
}
