import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import type { WeightChartModel } from '@/logic/progress';
import { dash, svgType, useTheme } from '@/theme';

interface Props { model: WeightChartModel }

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** Graf váhy (§7.6), čisté SVG. Osa Y vlevo (mono 11, tabulární), týdenní body r 4 a spojnice 1.5 v `text`,
 *  přerušovaná cílová linie v `muted` s popiskem. Poslední bod („tento týden“) podle R42 bez akcentu:
 *  větší plný bod + obrysový prstenec, takže vyčnívá tvarem. */
export function WeightChart({ model }: Props) {
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
            {n > 1 ? <Path d={line} stroke={c.text} strokeWidth={stroke.chart} fill="none" strokeLinejoin="round" /> : null}
            {model.points.map((p, i) => (i === n - 1 ? null : <Circle key={p.weekStart} cx={x(i)} cy={y(p.kg)} r={size.chartPoint} fill={c.text} />))}
            {latest !== null ? (
              <>
                <Circle cx={x(n - 1)} cy={y(latest)} r={size.chartPointRing} fill="none" stroke={c.text} strokeWidth={stroke.chart} />
                <Circle cx={x(n - 1)} cy={y(latest)} r={size.chartPointLast} fill={c.text} />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>
      {n === 0 ? <Text variant="caption" tone="muted">{copy.progress.weightEmpty}</Text> : null}
    </View>
  );
}
