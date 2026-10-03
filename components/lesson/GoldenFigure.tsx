// Konstrukční kresba kotouče, který právě zacvakl (ruling R43 §3): soustředné kružnice v φ poměrech
// kotouče (`Plate`) + zlatá spirála ze čtvrtkruhů. Jediná viditelná φ figura v appce, jen v oslavě.
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { PLATE_HOLE, PLATE_HUB, PLATE_R } from '@/components/map/Plate';
import { ease, motion } from '@/lib/motion';
import { PHI, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Dokreslení jedné linky (spec R43 §3) a odstup kružnic od nejmenší k největší. */
const DRAW_MS = 600;
const STEP_MS = 60;
/** Počet čtvrtkruhů spirály; další už by byly pod rozlišením vlasové linky. */
const ARCS = 5;
/** Kolik čtvrtkruhů dopočítat pro bod, do kterého spirála konverguje (limita, ne kresba). */
const LIMIT_STEPS = 48;

/** Poloměry kružnic od největší: R, R/φ, R/φ², R/φ³. Stejné poměry jako kotouč (PLATE_R → PLATE_HOLE). */
export function figureRadii(r: number): number[] {
  const k = r / PLATE_R;
  return [PLATE_R, PLATE_R / PHI, PLATE_HUB, PLATE_HOLE].map((x) => x * k);
}

/** Zlatý obdélník R·φ × R a spirála ze čtvrtkruhů ve čtvercích, které z něj postupně odřezává.
 *  Vše je posunuté tak, aby limita spirály (oko) ležela v (cx, cy). */
export function goldenSpiral(r: number, cx: number, cy: number) {
  let x = 0, y = 0, w = r * PHI, h = r;
  const arcs: { x0: number; y0: number; x1: number; y1: number; r: number }[] = [];
  for (let i = 0; i < LIMIT_STEPS; i++) {
    const d = i % 4;
    // Čtverec vlevo, nahoře, vpravo, dole; oblouk po směru hodinových ručiček přes jeho úhlopříčku.
    if (d === 0) { arcs.push({ x0: x, y0: y + h, x1: x + h, y1: y, r: h }); x += h; w -= h; }
    else if (d === 1) { arcs.push({ x0: x, y0: y, x1: x + w, y1: y + w, r: w }); y += w; h -= w; }
    else if (d === 2) { arcs.push({ x0: x + w, y0: y, x1: x + w - h, y1: y + h, r: h }); w -= h; }
    else { arcs.push({ x0: x + w, y0: y + h, x1: x, y1: y + h - w, r: w }); h -= w; }
  }
  const dx = cx - x, dy = cy - y;
  const drawn = arcs.slice(0, ARCS);
  const d = drawn.map((a, i) => `${i === 0 ? `M${a.x0 + dx} ${a.y0 + dy} ` : ''}A${a.r} ${a.r} 0 0 1 ${a.x1 + dx} ${a.y1 + dy}`).join(' ');
  const length = drawn.reduce((s, a) => s + (Math.PI / 2) * a.r, 0);
  return { d, length, rect: { x: dx, y: dy, w: r * PHI, h: r } };
}

interface Props {
  /** Poloměr největší kružnice. */
  r: number;
  /** Střed pravého kotouče v souřadnicích rodiče. */
  cx: number;
  cy: number;
  /** Dopad nastal: začne se kreslit. */
  drawn: boolean;
  calm: boolean;
}

/** Leží za osou, nic nepřijímá, čtečka ji přeskočí (je to ornament, informaci nese kotouč). */
export function GoldenFigure({ r, cx, cy, drawn, calm }: Props) {
  const { c, stroke } = useTheme();
  // Plátno přesahuje rodiče o R·φ na každou stranu (spirála i kružnice se vejdou, nic se neořízne
  // na Androidu); ořez dělá až kořen scény (overflow hidden).
  const pad = r * PHI;
  const x = cx + pad, y = cy + pad;
  const radii = figureRadii(r);
  const spiral = goldenSpiral(r, x, y);
  // Pořadí: kružnice od nejmenší (index 3) k největší, spirála současně s první.
  const circles = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const spiralT = useSharedValue(0);
  const fade = useSharedValue(0);

  useEffect(() => {
    if (!drawn) return;
    if (calm) { fade.set(withTiming(1, motion.calmFade)); return; }
    fade.set(1);
    const draw = { duration: DRAW_MS, easing: ease.out };
    circles.forEach((v, i) => v.set(withDelay((circles.length - 1 - i) * STEP_MS, withTiming(1, draw))));
    spiralT.set(withTiming(1, draw));
    // Odchod ze scény uprostřed kresby animace zastaví (stejně jako PlateNode).
    return () => { circles.forEach(cancelAnimation); cancelAnimation(spiralT); cancelAnimation(fade); };
    // Spouští se jednou při dopadu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawn]);

  const style = useAnimatedStyle(() => ({ opacity: fade.value }));
  const line = { stroke: c.rule, strokeWidth: stroke.hairline, fill: 'none' };

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', left: -pad, top: -pad, right: -pad, bottom: -pad }}>
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width="100%" height="100%">
          <Rect x={spiral.rect.x} y={spiral.rect.y} width={spiral.rect.w} height={spiral.rect.h} {...line} />
          {circles.map((v, i) => ({ v, rad: radii[i] ?? 0 })).map(({ v, rad }, i) => (
            <Stroke key={i} t={v} length={2 * Math.PI * rad} calm={calm}>
              {(props, dash) => <AnimatedCircle cx={x} cy={y} r={rad} {...line} strokeDasharray={dash} animatedProps={props} />}
            </Stroke>
          ))}
          <Stroke t={spiralT} length={spiral.length} calm={calm}>
            {(props, dash) => <AnimatedPath d={spiral.d} {...line} strokeDasharray={dash} animatedProps={props} />}
          </Stroke>
        </Svg>
      </Animated.View>
    </View>
  );
}

// Stejný vzor jako zaškrtnutí v PlateNode: dasharray = délka, animovaný strokeDashoffset délka → 0.
function Stroke({ t, length, calm, children }: {
  t: SharedValue<number>; length: number; calm: boolean;
  children(props: Partial<{ strokeDashoffset: number }>, dash: string): React.ReactElement;
}) {
  const props = useAnimatedProps(() => ({ strokeDashoffset: calm ? 0 : (1 - t.value) * length }));
  return children(props, `${length} ${length}`);
}
