import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, intro, useMotionSafe } from '@/lib/motion';
import type { WeightChartModel } from '@/logic/progress';
import { dash, dots, svgType, useTheme } from '@/theme';

interface Props {
  model: WeightChartModel;
  /** Úvodní sled (motion): body se rozsvítí zleva doprava jako sken. */
  play?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * Tečkový graf váhy (Nothing Dot fáze 2), čisté SVG (bez Skia: nežere rozpočet pláten). Jeden týden = jedna
 * tečka v `text`, bez spojnice: graf mluví stejným jazykem jako zbytek obrazovky. Poslední tečka („tento týden“)
 * je větší a v dark září (`glow`), v light je jen větší (záře je tam vypnutá). Cíl = tečkovaná linie `muted`
 * s mono popiskem, osa Y mono 11 vlevo.
 */
export function WeightChart({ model, play = false }: Props) {
  const { c, size, space } = useTheme();
  const [width, setWidth] = useState(0);
  const h = size.chartHeight;
  const ch = dots.chart;
  const pad = (ch.dLast / 2) * dots.glow.scale; // místo pro záři posledního bodu u krajů
  const left = size.chartAxis;
  const plotW = Math.max(0, width - left - pad);
  const top = pad;
  const plotH = h - pad * 2;
  const span = model.yMax - model.yMin || 1;
  const y = (kg: number) => top + (1 - (kg - model.yMin) / span) * plotH;
  const n = model.points.length;
  const x = (i: number) => left + (n <= 1 ? plotW : (i / (n - 1)) * plotW);
  const latest = n > 0 ? model.points[n - 1]!.kg : null;
  const ty = y(model.targetKg);
  // Kdy sken mine bod: podíl pozice zleva.
  const at = (i: number) => (n <= 1 ? 1 : i / (n - 1));

  // Motion: průběh skenu 0 → 1 (900 ms ease-out) po změření šířky; jen při prvním zobrazení.
  const { reduced } = useMotionSafe();
  const [animate] = useState(play && !reduced);
  const draw = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate && width > 0 && draw.value === 0) draw.value = withDelay(intro.chart.at, withTiming(1, { duration: intro.chart.ms, easing: ease.out }));
  }, [animate, width, draw]);

  return (
    <View accessible accessibilityLabel={copy.progress.chartA11y(latest, model.targetKg)} style={{ gap: space.s }}>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: h }}>
        {width > 0 ? (
          <Svg width={width} height={h}>
            {model.yTicks.map((t) => (
              <SvgText key={t} x={left - space.s} y={y(t) + svgType.axis.fontSize / 3} textAnchor="end" fill={c.muted} {...svgType.axis}>{fmt(t)}</SvgText>
            ))}
            {/* Cílová linie z teček (nulové úseky s kulatým koncem). */}
            <Line x1={left} y1={ty} x2={left + plotW} y2={ty} stroke={c.muted} strokeWidth={dots.rule.d} strokeLinecap="round" strokeDasharray={dash.dots} />
            <SvgText
              x={left + plotW} y={ty < top + svgType.axis.fontSize * 2 ? ty + svgType.axis.fontSize + space.xs : ty - space.s}
              textAnchor="end" fill={c.muted} {...svgType.label}
            >
              {copy.progress.targetLine(model.targetKg)}
            </SvgText>
            {model.points.map((p, i) => (i === n - 1 ? null : (
              <Dot key={p.weekStart} draw={draw} at={at(i)} cx={x(i)} cy={y(p.kg)} r={ch.d / 2} fill={c.text} />
            )))}
            {latest !== null ? (
              <>
                <Dot draw={draw} at={1} cx={x(n - 1)} cy={y(latest)} r={pad} fill={c.glow} />
                <Dot draw={draw} at={1} cx={x(n - 1)} cy={y(latest)} r={ch.dLast / 2} fill={c.text} />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>
      {n === 0 ? <Text variant="caption" tone="muted">{copy.progress.weightEmpty}</Text> : null}
    </View>
  );
}

/** Bod grafu: rozsvítí se (opacita, 4 % průběhu), když ho sken mine. */
function Dot({ draw, at, r, ...rest }: { draw: SharedValue<number>; at: number; cx: number; cy: number; r: number; fill: string }) {
  const props = useAnimatedProps(() => ({ opacity: Math.min(1, Math.max(0, (draw.value - at + 0.04) / 0.04)) }));
  return <AnimatedCircle {...rest} r={r} animatedProps={props} />;
}
