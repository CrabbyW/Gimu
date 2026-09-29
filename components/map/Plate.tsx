import { Lock } from 'lucide-react-native';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { NodeState } from '@/logic/map';
import { copy } from '@/data/copy';
import { inkOn, useTheme } from '@/theme';
import type { PlateKg } from '@/types';

interface Props {
  kg: PlateKg;
  size: number;
  state: NodeState;
  /** false = dokončený kotouč bez fajfky (kreslí ji animovaně PlateNode). */
  check?: boolean;
}

/** Fajfka přes středový otvor (§6.5), ve viewBoxu 100×100. Délka tahu ≈ 18. */
export const CHECK_PATH = 'M44 50 l4 4 l8 -9';
export const CHECK_LENGTH = 18;

/** Kotouč zepředu: plný kruh, vnitřní prstenec, díra, kg v Bebas. Hloubku dělá radiální světlo a jemné zrno. */
export function Plate({ kg, size, state, check = true }: Props) {
  const { c, seasonal, font } = useTheme();
  // ID defs musí být v dokumentu unikátní (na webu je víc kotoučů v jednom DOM).
  const uid = useId().replace(/[^\w-]/g, '');
  const light = `plate-light-${uid}`;
  const grain = `plate-grain-${uid}`;

  if (state === 'locked') {
    const icon = Math.round(size * 0.3);
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
          <Circle cx={50} cy={50} r={48} fill="none" stroke={c.rule} strokeWidth={2} />
        </Svg>
        <Lock size={icon} color={c.muted} strokeWidth={1.5} />
      </View>
    );
  }

  const fill = c[`plate${kg}`];
  const ink = inkOn(fill, c);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        {/* Světlo shora vlevo a stín dole vpravo: lité železo, gradient dělá hloubku. */}
        <RadialGradient id={light} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor={c.plateHighlight} stopOpacity={1} />
          <Stop offset="1" stopColor={c.onAccent} stopOpacity={0.22} />
        </RadialGradient>
        <Pattern id={grain} width={4} height={4} patternUnits="userSpaceOnUse">
          <Rect width={1} height={1} fill={c.plateHighlight} />
          <Rect x={2} y={3} width={1} height={1} fill={c.onAccent} opacity={0.1} />
        </Pattern>
      </Defs>
      <Circle cx={50} cy={50} r={48} fill={fill} />
      <Circle cx={50} cy={50} r={48} fill={`url(#${light})`} />
      <Circle cx={50} cy={50} r={48} fill={`url(#${grain})`} />
      <Circle cx={50} cy={50} r={40} fill="none" stroke={c.plateRim} strokeWidth={1.2} />
      <Circle cx={50} cy={50} r={20} fill="none" stroke={c.plateRim} strokeWidth={1.2} />
      <Circle cx={50} cy={50} r={9} fill={seasonal.mapBase} />
      <SvgText x={50} y={36} fontFamily={font.display} fontSize={22} fill={ink} opacity={0.92} textAnchor="middle">{kg}</SvgText>
      <SvgText x={50} y={80} fontFamily={font.mono} fontSize={9} fill={ink} opacity={0.6} textAnchor="middle" letterSpacing={1.5}>{copy.map.kgUnit}</SvgText>
      {state === 'done' && check ? (
        <Path d={CHECK_PATH} stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </Svg>
  );
}
