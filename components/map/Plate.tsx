import { Lock } from 'lucide-react-native';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Path, Pattern, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { NodeState } from '@/logic/map';
import { inkOn, PHI, stroke, svgType, useTheme } from '@/theme';
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

/** R43 proporce kotouče (viewBox 100): vnější R, náboj R/φ², otvor R/φ³. Lem 40 je fyzický lem, ne φ.
 *  Sdílí je i konstrukční figura oslavy (`GoldenFigure`). */
export const PLATE_R = 48;
export const PLATE_RIM = 40;
export const PLATE_HUB = PLATE_R / PHI ** 2;
export const PLATE_HOLE = PLATE_R / PHI ** 3;

/** Kotouč zepředu: plný kruh, vnitřní prstenec, díra, kg v display řezu (Inter Light). Hloubku dělá radiální světlo a jemné zrno. */
export function Plate({ kg, size, state, check = true }: Props) {
  const { c, seasonal } = useTheme();
  // ID defs musí být v dokumentu unikátní (na webu je víc kotoučů v jednom DOM).
  const uid = useId().replace(/[^\w-]/g, '');
  const light = `plate-light-${uid}`;
  const grain = `plate-grain-${uid}`;

  if (state === 'locked') {
    const icon = Math.round(size * 0.3);
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
          <Circle cx={50} cy={50} r={PLATE_R} fill="none" stroke={c.rule} strokeWidth={stroke.focus} />
        </Svg>
        <Lock size={icon} color={c.muted} strokeWidth={stroke.icon} />
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
          <Stop offset="1" stopColor={c.shadow} stopOpacity={0.22} />
        </RadialGradient>
        <Pattern id={grain} width={4} height={4} patternUnits="userSpaceOnUse">
          <Rect width={1} height={1} fill={c.plateHighlight} />
          <Rect x={2} y={3} width={1} height={1} fill={c.shadow} opacity={0.1} />
        </Pattern>
      </Defs>
      <Circle cx={50} cy={50} r={PLATE_R} fill={fill} />
      <Circle cx={50} cy={50} r={PLATE_R} fill={`url(#${light})`} />
      <Circle cx={50} cy={50} r={PLATE_R} fill={`url(#${grain})`} />
      <Circle cx={50} cy={50} r={PLATE_RIM} fill="none" stroke={c.plateRim} strokeWidth={stroke.plate} />
      <Circle cx={50} cy={50} r={PLATE_HUB} fill="none" stroke={c.plateRim} strokeWidth={stroke.plate} />
      <Circle cx={50} cy={50} r={PLATE_HOLE} fill={seasonal.mapBase} />
      <SvgText x={50} y={29} fontFamily={svgType.plateKg.fontFamily} fontSize={svgType.plateKg.fontSize} letterSpacing={svgType.plateKg.letterSpacing} fill={ink} textAnchor="middle">{kg}</SvgText>
      {/* R42: fajfka v `text` (bílá na tmavém otvoru), akcent patří jen oslavě dokončení. */}
      {state === 'done' && check ? (
        <Path d={CHECK_PATH} stroke={c.text} strokeWidth={stroke.check} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </Svg>
  );
}
