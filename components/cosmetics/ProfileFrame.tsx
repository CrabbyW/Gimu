import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { mascot, useTheme } from '@/theme';

interface Props {
  /** Id kosmetiky slotu `profileFrame`; bez něj jen tichý obrysový kruh `rule`. */
  frameId?: string;
  /** Vnitřní průměr (velikost obsahu, např. opice L = 200). */
  size: number;
  children?: ReactNode;
}

/** Rám kolem opice v profilu (§7.8). `frame-plate-ring` = kotoučový prstenec (plate20 + vnitřní linka plateRim),
 *  `frame-ember-ring` = tenký prstenec v materiálové barvě Ember (`mascot.tankRim`, ne UI akcent — R42). */
export function ProfileFrame({ frameId, size: inner, children }: Props) {
  const { c, size, stroke } = useTheme();
  const ring = size.frameRing;
  const outer = inner + ring * 2;
  const r = outer / 2;
  return (
    <View style={{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={outer} height={outer} style={{ position: 'absolute' }}>
        {frameId === 'frame-plate-ring' ? (
          <>
            <Circle cx={r} cy={r} r={r - ring / 2} fill="none" stroke={c.plate20} strokeWidth={ring} />
            <Circle cx={r} cy={r} r={r - ring + stroke.icon} fill="none" stroke={c.plateRim} strokeWidth={stroke.icon} />
            <Circle cx={r} cy={r} r={r - stroke.icon} fill="none" stroke={c.plateHighlight} strokeWidth={stroke.icon} />
          </>
        ) : frameId === 'frame-ember-ring' ? (
          <Circle cx={r} cy={r} r={r - ring / 2} fill="none" stroke={mascot.tankRim} strokeWidth={stroke.ring} />
        ) : (
          <Circle cx={r} cy={r} r={r - ring / 2} fill="none" stroke={c.rule} strokeWidth={1} />
        )}
      </Svg>
      <View style={{ width: inner, height: inner, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
