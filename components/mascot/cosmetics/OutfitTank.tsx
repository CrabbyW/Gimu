import { G, Path } from 'react-native-svg';
import { MASCOT_COLORS } from '../palette';
import { anchorTransform, type LayerProps } from './types';

// Tílko přes trup (stage 1: trup ±28 × ±26 kolem kotvy body). Ořez na trup dělá SvgMascot.
const BODY = 'M-30 32 L-30 -4 Q-22 -8 -20 -28 L-12 -28 Q-10 -6 0 -6 Q10 -6 12 -28 L20 -28 Q22 -8 30 -4 L30 32 Z';
const RIM = 'M-12 -28 Q-10 -6 0 -6 Q10 -6 12 -28 M-30 -4 Q-22 -8 -20 -28 M30 -4 Q22 -8 20 -28';

/** Tílko Ember: výplň inkoustem 85 % přes stín srsti, lem 3 px v barvě materiálu opice
 *  (`mascot.tankRim`), ne v UI akcentu — opice je jediný barevný objekt, akcent patří oslavě lekce (R42). */
export function OutfitTank({ anchor, ink }: LayerProps) {
  return (
    <G transform={anchorTransform(anchor)}>
      {/* Podklad ve stínu srsti, aby 85% inkoust nepropouštěl světlé bříško. */}
      <Path d={BODY} fill={MASCOT_COLORS.furShade} />
      <Path d={BODY} fill={ink} fillOpacity={0.85} />
      <Path d={RIM} stroke={MASCOT_COLORS.tankRim} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  );
}
