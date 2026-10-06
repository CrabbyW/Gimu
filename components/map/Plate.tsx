import { Lock } from 'lucide-react-native';
import { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Path, Pattern, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { copy } from '@/data/copy';
import type { NodeState } from '@/logic/map';
import { inkOn, opacity, PHI, stroke, svgType, useTheme } from '@/theme';
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
 *  Z litinového kotouče dnes zbývá jen fajfka (`CHECK_*`), kterou kreslí `PlateNode` přes tečkový `DotPlate`. */
export const PLATE_R = 48;
export const PLATE_RIM = 40;
export const PLATE_HUB = PLATE_R / PHI ** 2;
export const PLATE_HOLE = PLATE_R / PHI ** 3;

/** Oblouk kružnice se středem (50, 50) od úhlu `from` do `to` (stupně, 0° = vpravo, po směru hodinových ručiček). */
function arc(r: number, from: number, to: number): string {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
  };
  const large = to - from > 180 ? 1 : 0;
  return `M ${p(from)} A ${r} ${r} 0 ${large} 1 ${p(to)}`;
}

/**
 * Litinový kotouč zepředu (hloubka a materiál, 2026-10-03). Stavba jako u skutečného odlitku:
 * - vnější lem 40–48 se soustruženými drážkami (střídavě stín a světlo, `material.plateLipGrooves`),
 * - odlesk na horní levé hraně (`text` na `opacity.glint`) a stín na dolní pravé (`plateShade`): světlo shora vlevo,
 * - zapuštěná čelní plocha: stín pod horní hranou lemu, světlo nad dolní (vnitřní hrana prohlubně),
 * - vystouplý náboj (`plateHighlight`) se dvěma drážkami a zkoseným otvorem,
 * - číslo kg vyražené do plochy: posunutý světlý a tmavý otisk pod plnou barvou (kontrast čísla beze změny),
 *   od průměru `size.plateUnitMin` i ražené „KG“ ve spodním pásu.
 * Hloubku plochy dál dělá radiální světlo a jemné zrno.
 */
export function Plate({ kg, size, state, check = true }: Props) {
  const { c, seasonal, size: tokens, material } = useTheme();
  // ID defs musí být v dokumentu unikátní (na webu je víc kotoučů v jednom DOM).
  const uid = useId().replace(/[^\w-]/g, '');
  const light = `plate-light-${uid}`;
  const grain = `plate-grain-${uid}`;

  if (state === 'locked') {
    // Teplá litina §2.7: obrys `faint` 1.5 pt (přepočet z pt do viewBoxu 100), `Lock` 12 `muted` v náboji, bez stínu.
    const outline = (stroke.icon * 100) / size;
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
          <Circle cx={50} cy={50} r={PLATE_R} fill="none" stroke={c.faint} strokeWidth={outline} />
        </Svg>
        <Lock size={tokens.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />
      </View>
    );
  }

  const fill = c[`plate${kg}`];
  const ink = inkOn(fill, c);
  const [glintFrom, glintTo] = material.plateGlint;
  // Protilehlá strana odlesku (o 180°): tam leží stín hrany.
  const shadeFrom = glintFrom - 180;
  const shadeTo = glintTo - 180;
  const stamp = material.plateStamp;
  const kgText = { fontFamily: svgType.plateKg.fontFamily, fontSize: svgType.plateKg.fontSize, letterSpacing: svgType.plateKg.letterSpacing, textAnchor: 'middle' as const };
  const unitText = { fontFamily: svgType.plateUnit.fontFamily, fontSize: svgType.plateUnit.fontSize, letterSpacing: svgType.plateUnit.letterSpacing, textAnchor: 'middle' as const };
  const showUnit = size >= tokens.plateUnitMin;
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

      {/* Soustružený lem: drážky střídavě stín / světlo. */}
      {material.plateLipGrooves.map((r, i) => (
        <Circle key={r} cx={50} cy={50} r={r} fill="none" stroke={i % 2 === 0 ? c.plateShade : c.plateHighlight} strokeWidth={stroke.groove} />
      ))}
      {/* Hrana odlitku: odlesk nahoře vlevo, stín dole vpravo. */}
      <Path d={arc(PLATE_R - stroke.glint / 2, glintFrom, glintTo)} fill="none" stroke={c.text} strokeOpacity={opacity.glint} strokeWidth={stroke.glint} strokeLinecap="round" />
      <Path d={arc(PLATE_R - stroke.glint / 2, shadeFrom, shadeTo)} fill="none" stroke={c.plateShade} strokeWidth={stroke.glint} strokeLinecap="round" />

      {/* Zapuštěná čelní plocha: hrana lemu, pod ní stín nahoře a světlo dole. */}
      <Circle cx={50} cy={50} r={PLATE_RIM} fill="none" stroke={c.plateRim} strokeWidth={stroke.plate} />
      <Path d={arc(PLATE_RIM - stroke.plate, glintFrom, glintTo)} fill="none" stroke={c.plateShade} strokeWidth={stroke.plate} strokeLinecap="round" />
      <Path d={arc(PLATE_RIM - stroke.plate, shadeFrom, shadeTo)} fill="none" stroke={c.plateHighlight} strokeWidth={stroke.plate} strokeLinecap="round" />

      {/* Vystouplý náboj se dvěma drážkami. */}
      <Circle cx={50} cy={50} r={PLATE_HUB} fill={c.plateHighlight} stroke={c.plateRim} strokeWidth={stroke.plate} />
      {material.plateHubGrooves.map((d) => (
        <Circle key={d} cx={50} cy={50} r={PLATE_HUB - d} fill="none" stroke={c.plateShade} strokeWidth={stroke.groove} />
      ))}

      {/* Otvor se zkosením: stín padá na horní levou vnitřní hranu, světlo chytá dolní pravá. */}
      <Circle cx={50} cy={50} r={PLATE_HOLE} fill={seasonal.mapBase} />
      <Path d={arc(PLATE_HOLE + stroke.bevel / 2, glintFrom, glintTo)} fill="none" stroke={c.shadow} strokeWidth={stroke.bevel} strokeLinecap="round" />
      <Path d={arc(PLATE_HOLE + stroke.bevel / 2, shadeFrom, shadeTo)} fill="none" stroke={c.plateHighlight} strokeWidth={stroke.bevel} strokeLinecap="round" />

      {/* Ražba: světlý otisk dole a tmavý nahoře = číslo vtlačené do plochy. */}
      <G>
        <SvgText x={50} y={29 + stamp} fill={c.plateHighlight} {...kgText}>{kg}</SvgText>
        <SvgText x={50} y={29 - stamp} fill={c.plateShade} {...kgText}>{kg}</SvgText>
        <SvgText x={50} y={29} fill={ink} {...kgText}>{kg}</SvgText>
      </G>
      {showUnit ? (
        <G>
          <SvgText x={50} y={81 + stamp / 2} fill={c.plateHighlight} {...unitText}>{copy.map.plateUnit}</SvgText>
          <SvgText x={50} y={81} fill={ink} {...unitText}>{copy.map.plateUnit}</SvgText>
        </G>
      ) : null}

      {/* R42: fajfka v `text` (bílá na tmavém otvoru), akcent patří jen oslavě dokončení. */}
      {state === 'done' && check ? (
        <Path d={CHECK_PATH} stroke={c.text} strokeWidth={stroke.check} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </Svg>
  );
}
