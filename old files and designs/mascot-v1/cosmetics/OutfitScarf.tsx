import { G, Rect } from 'react-native-svg';
import { SEASON_MATERIAL } from '@/theme/seasons';
import { useTheme } from '@/theme';
import { anchorTransform, type LayerProps } from './types';

/** Tvar šály (kotva neck): smyčka kolem krku, cíp přes hruď se dvěma pruhy a třemi třásněmi.
 *  Ocelová modrošedá Winter Arc (`SEASON_MATERIAL`), i když se šála nosí mimo sezónu. */
export function ScarfShape({ anchor }: LayerProps) {
  const { scheme } = useTheme();
  const w = SEASON_MATERIAL.winterArc[scheme];
  return (
    <G transform={anchorTransform(anchor)}>
      <Rect x={8} y={2} width={13} height={28} rx={3} fill={w.fabric} />
      <Rect x={8} y={12} width={13} height={2.5} fill={w.stripe} />
      <Rect x={8} y={19} width={13} height={2.5} fill={w.stripe} />
      <Rect x={9.5} y={30} width={2} height={5} fill={w.fabric} />
      <Rect x={13.5} y={30} width={2} height={5} fill={w.fabric} />
      <Rect x={17.5} y={30} width={2} height={5} fill={w.fabric} />
      <Rect x={-32} y={-7} width={64} height={15} rx={7.5} fill={w.fabric} />
    </G>
  );
}

/** Šála Winter Arc jako nasazený outfit (odměna sezóny). */
export const OutfitScarf = ScarfShape;
