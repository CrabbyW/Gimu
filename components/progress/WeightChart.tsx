import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, intro, useMotionSafe } from '@/lib/motion';
import type { WeightChartModel } from '@/logic/progress';
import { dash, svgType, useTheme } from '@/theme';

interface Props {
  model: WeightChartModel;
  /** Úvodní sled (motion): spojnice se vykreslí čarou zleva doprava, body naskočí, jak je čára mine. */
  play?: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** Graf váhy (§7.6), čisté SVG. Osa Y vlevo (mono 11, tabulární), týdenní body r 4 a spojnice 1.5 v `text`,
 *  přerušovaná cílová linie v `muted` s popiskem. Poslední bod („tento týden“) podle R42 bez akcentu:
 *  větší plný bod + obrysový prstenec, takže vyčnívá tvarem. */
export function WeightChart({ model, play = false }: Props) {
  const { c, size, stroke, space } = useTheme();
  const [width, setWidth] = useState(0);
  const h = size.chartHeight;
  const pad = size.chartPointRing; // místo pro prstenec posledního bodu u krajů
  const left = size.chartAxis;
  const plotW = Math.max(0, width - left - pad);
  const top = pad;
  const plotH = h - pad * 2;
  const span = model.yMax - model.yMin || 1;
  const y = (kg: number) => top + (1 - (kg - model.yMin) / span) * plotH;
  const n = model.points.length;
  const x = (i: number) => left + (n <= 1 ? plotW : (i / (n - 1)) * plotW);
  const latest = n > 0 ? model.points[n - 1]!.kg : null;
  const line = model.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.kg)}`).join(' ');
  const ty = y(model.targetKg);
  // Délka spojnice a podíl délky u každého bodu (kdy ho čára mine).
  const seg = model.points.map((p, i) => (i === 0 ? 0 : Math.hypot(x(i) - x(i - 1), y(p.kg) - y(model.points[i - 1]!.kg))));
  const length = seg.reduce((a, b) => a + b, 0);
  const at = seg.map((_, i) => (length > 0 ? seg.slice(0, i + 1).reduce((a, b) => a + b, 0) / length : 1));

  // Motion: průběh kreslení 0 → 1 (900 ms ease-out) po změření šířky; jen při prvním zobrazení.
  const { reduced } = useMotionSafe();
  const [animate] = useState(play && !reduced);
  const draw = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate && width > 0 && draw.value === 0) draw.value = withDelay(intro.chart.at, withTiming(1, { duration: intro.chart.ms, easing: ease.out }));
  }, [animate, width, draw]);
  const lineProps = useAnimatedProps(() => ({ strokeDashoffset: length * (1 - draw.value) }));

  return (
    <View accessible accessibilityLabel={copy.progress.chartA11y(latest, model.targetKg)} style={{ gap: space.s }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: h }}>
        {width > 0 ? (
          <Svg width={width} height={h}>
            {model.yTicks.map((t) => (
              <SvgText key={t} x={left - space.s} y={y(t) + svgType.axis.fontSize / 3} textAnchor="end" fill={c.muted} {...svgType.axis}>{fmt(t)}</SvgText>
            ))}
            <Line x1={left} y1={top} x2={left} y2={top + plotH} stroke={c.rule} strokeWidth={1} />
            <Line x1={left} y1={ty} x2={left + plotW} y2={ty} stroke={c.muted} strokeWidth={stroke.chart} strokeDasharray={dash.target} />
            <SvgText
              x={left + plotW} y={ty < top + svgType.axis.fontSize * 2 ? ty + svgType.axis.fontSize + space.xs : ty - space.s}
              textAnchor="end" fill={c.muted} {...svgType.label}
            >
              {copy.progress.targetLine(model.targetKg)}
            </SvgText>
            {n > 1 ? (
              <AnimatedPath
                d={line} stroke={c.text} strokeWidth={stroke.chart} fill="none" strokeLinejoin="round"
                strokeDasharray={`${length} ${length}`} animatedProps={lineProps}
              />
            ) : null}
            {model.points.map((p, i) => (i === n - 1 ? null : (
              <Dot key={p.weekStart} draw={draw} at={at[i]!} cx={x(i)} cy={y(p.kg)} r={size.chartPoint} fill={c.text} />
            )))}
            {latest !== null ? (
              <>
                <Dot draw={draw} at={1} cx={x(n - 1)} cy={y(latest)} r={size.chartPointRing} fill="none" stroke={c.text} strokeWidth={stroke.chart} grow />
                <Dot draw={draw} at={1} cx={x(n - 1)} cy={y(latest)} r={size.chartPointLast} fill={c.text} />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>
      {n === 0 ? <Text variant="caption" tone="muted">{copy.progress.weightEmpty}</Text> : null}
    </View>
  );
}

/** Bod grafu: naskočí (opacita, 4 % průběhu), když ho čára mine. Prstenec posledního bodu se navíc
 *  rozevře z 0.5 r (`grow`) jako dopad křivky na „tento týden“. */
function Dot({ draw, at, r, grow = false, ...rest }: {
  draw: SharedValue<number>; at: number; cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number; grow?: boolean;
}) {
  const props = useAnimatedProps(() => {
    const k = Math.min(1, Math.max(0, (draw.value - at + 0.04) / 0.04));
    return { opacity: k, r: grow ? r * (0.5 + 0.5 * k) : r };
  });
  return <AnimatedCircle {...rest} r={r} animatedProps={props} />;
}
