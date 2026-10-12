import { useEffect, useId } from 'react';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Mask, Path } from 'react-native-svg';
import { motion, useMotionSafe } from '@/lib/motion';
import { dots, useTheme } from '@/theme';
import { segmentLength, segmentPath, type NodePosition } from './geometry';

type Point = { x: number; y: number };
const EDGE_GAP = 6;
const bottomOf = (p: NodePosition): Point => ({ x: p.x, y: p.y + p.size / 2 + EDGE_GAP });
const topOf = (p: NodePosition): Point => ({ x: p.x, y: p.y - p.size / 2 - EDGE_GAP });
const AnimatedPath = Animated.createAnimatedComponent(Path);
const DRAW_MS = motion.pathDrawMs;
// Nothing Dot: čárka nulové délky s kulatým koncem = přesná tečka průměru 2r každých `pitch` pt.
const DOTS = { strokeWidth: dots.path.r * 2, strokeDasharray: `0 ${dots.path.pitch}`, strokeLinecap: 'round' as const, fill: 'none' };

interface Props {
  width: number;
  height: number;
  positions: NodePosition[];
  /** Úsek i vede z uzlu i do i+1; true = cíl už není zamčený (prošlá cesta, `muted`). */
  reached: boolean[];
  /** Index úseku, který se právě dokresluje (odemykací sekvence). */
  drawing?: number | null;
  /** Spodní hrana popisku pod každým uzlem (y): úsek začíná až pod ním, takže cesta text nikdy nekříží. */
  labelBottoms?: number[];
  /** Nejvyšší bod obsahu každého uzlu (opička, nadpis sekce): úsek do uzlu končí nad ním. */
  ends?: number[];
}

/** Tečkovaná cesta mezi uzly (Kurogane): prošlé úseky až k aktuálnímu uzlu světlejší `dotDim`,
 *  cesta k zamčeným skoro zhasnutá `dotOff` — cesta je struktura, ne hrdina (hrdina = aktuální uzel). Stejné tečky jako zbytek jazyka, ne přerušovaná čára. */
export function PathLine({ width, height, positions, reached, drawing = null, labelBottoms, ends }: Props) {
  const { c } = useTheme();
  // Úsek vede od spodní hrany popisku uzlu (bez popisku od hrany kotouče) k horní hraně dalšího:
  // čára nikdy nekříží kotouč, popisek ani text bosse.
  const startOf = (i: number): Point => {
    const p = positions[i]!;
    const lb = labelBottoms?.[i];
    return lb === undefined ? bottomOf(p) : { x: p.x, y: lb + EDGE_GAP };
  };
  // Konec nad `ends[i]` (vrch uzlu včetně opičky, u začátku sekce nad jejím nadpisem): cesta je nekříží.
  const segments = positions.slice(1).map((b, i) => {
    const end = ends?.[i + 1];
    return { i, a: startOf(i), b: end === undefined ? topOf(b) : { x: b.x, y: end - EDGE_GAP } };
  });
  return (
    <Svg aria-hidden width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {segments.map(({ i, a, b }) => (
        <Path key={i} d={segmentPath(a, b)} stroke={reached[i] && drawing !== i ? c.dotDim : c.dotOff} {...DOTS} />
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
      <Path d={d} stroke={c.dotDim} mask={`url(#${mask})`} {...DOTS} />
    </>
  );
}
