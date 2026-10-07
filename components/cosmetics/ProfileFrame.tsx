import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { dots, mascot, useTheme } from '@/theme';

interface Props {
  /** Id kosmetiky slotu `profileFrame`; bez něj jen tichý tečkový kruh `dotOff`. */
  frameId?: string;
  /** Vnitřní průměr (velikost obsahu, např. opice 160). */
  size: number;
  children?: ReactNode;
}

/**
 * Rám kolem opice (Nothing Dot fáze 2), SVG (bez Skia plátna). Tečkový jazyk: kruh z teček (nulové úseky
 * s kulatým koncem). Bez rámu = tichý kruh `dotOff`; `frame-plate-ring` = dvojitý tečkový prstenec v `text`
 * (kotouč); `frame-ember-ring` = tečkový prstenec v materiálové barvě Ember (`mascot.tankRim`). Barva rámu
 * je kosmetika opičky, ne UI akcent: opička je jediný barevný subjekt.
 */
export function ProfileFrame({ frameId, size: inner, children }: Props) {
  const { c, size, stroke } = useTheme();
  const ring = size.frameRing;
  const outer = inner + ring * 2;
  const r = outer / 2;
  const dotted = { fill: 'none', strokeLinecap: 'round' as const, strokeDasharray: `0 ${dots.rule.gap + dots.rule.d}` };
  return (
    <View style={{ width: outer, height: outer, alignItems: 'center', justifyContent: 'center' }}>
      <Svg aria-hidden width={outer} height={outer} style={{ position: 'absolute' }}>
        {frameId === 'frame-plate-ring' ? (
          <>
            <Circle cx={r} cy={r} r={r - stroke.ring} stroke={c.text} strokeWidth={stroke.ring} {...dotted} />
            <Circle cx={r} cy={r} r={r - ring + stroke.ring} stroke={c.text} strokeWidth={stroke.ring} {...dotted} />
          </>
        ) : frameId === 'frame-ember-ring' ? (
          <Circle cx={r} cy={r} r={r - ring / 2} stroke={mascot.tankRim} strokeWidth={stroke.ring} {...dotted} />
        ) : (
          <Circle cx={r} cy={r} r={r - ring / 2} stroke={c.dotOff} strokeWidth={dots.rule.d} {...dotted} />
        )}
      </Svg>
      <View style={{ width: inner, height: inner, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}
