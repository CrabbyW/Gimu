import { G, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';
import { anchorTransform, type LayerProps } from './types';

/** Čelenka: pruh přes čelo nad očima v `text`. Ořez na hlavu dělá SvgMascot. */
export function AccHeadband({ anchor }: LayerProps) {
  const { c } = useTheme();
  return (
    <G transform={anchorTransform(anchor)}>
      <Rect x={-56} y={-40} width={112} height={11} fill={c.text} />
    </G>
  );
}
