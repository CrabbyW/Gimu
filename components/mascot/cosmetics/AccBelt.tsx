import { G, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';
import { anchorTransform, type LayerProps } from './types';

/** Vzpěračský pás v pase v `plate20`, přezka jako obrys v `plate5`. Ořez na trup dělá SvgMascot. */
export function AccBelt({ anchor }: LayerProps) {
  const { c } = useTheme();
  return (
    <G transform={anchorTransform(anchor)}>
      <Rect x={-32} y={8} width={64} height={12} fill={c.plate20} />
      <Rect x={-6} y={7} width={12} height={14} rx={2} stroke={c.plate5} strokeWidth={2} fill="none" />
    </G>
  );
}
