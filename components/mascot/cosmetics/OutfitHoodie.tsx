import { Ellipse, G, Path, Rect } from 'react-native-svg';
import { useTheme } from '@/theme';
import { anchorTransform, type LayerProps } from './types';

/** Mikina Křída: trup v `rule`, klokaní kapsa a šňůrky v `muted`. Ořez na trup dělá SvgMascot. */
export function OutfitHoodie({ anchor }: LayerProps) {
  const { c } = useTheme();
  return (
    <G transform={anchorTransform(anchor)}>
      <Rect x={-32} y={-30} width={64} height={62} fill={c.rule} />
      <Path d="M-14 26 L-14 12 Q-14 6 -8 6 L8 6 Q14 6 14 12 L14 26" stroke={c.muted} strokeWidth={1.5} fill="none" />
      <Path d="M-5 -12 L-6 0 M5 -12 L6 0" stroke={c.muted} strokeWidth={1.5} strokeLinecap="round" />
    </G>
  );
}

/** Kapuce shrnutá za hlavou (kotva neck, vrstva back): vykoukne po stranách pod hlavou. */
export function HoodieHood({ anchor }: LayerProps) {
  const { c } = useTheme();
  return (
    <G transform={anchorTransform(anchor)}>
      <Ellipse cx={0} cy={-2} rx={36} ry={12} fill={c.rule} />
    </G>
  );
}
