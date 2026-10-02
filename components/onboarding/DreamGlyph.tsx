import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { DreamGlyphId } from '@/hooks/useOnboardingDraft';

interface Props {
  glyph: DreamGlyphId;
  /** Barva tvaru (`muted`, u vybrané karty `text`). */
  color: string;
  /** Barva podkladu karty, prosvítá otvory. */
  bg: string;
  size: number;
}

/** Plochý glyf vize těla ze skládaných kruhů, stejný jazyk jako `PathGlyph`. Dekorativní: význam nese text karty. */
export function DreamGlyph({ glyph, color, bg, size }: Props) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={size} height={size} viewBox="0 0 48 48">
      {SHAPES[glyph](color, bg)}
    </Svg>
    </View>
  );
}

const SHAPES: Record<DreamGlyphId, (color: string, bg: string) => React.ReactNode> = {
  // Výseč: směr, výbuch (glyf cesty Power).
  wedge: (c) => <Path d="M24 24 L24 4 A20 20 0 1 1 4 24 Z" fill={c} />,
  // Dva kruhy v rovnováze (glyf cesty Body control).
  balance: (c) => (<><Circle cx={24} cy={14} r={9} fill={c} /><Circle cx={24} cy={35} r={11} fill="none" stroke={c} strokeWidth={2} /></>),
  // Těžký kotouč s otvorem (glyf cesty Strength).
  plate: (c, bg) => (<><Circle cx={24} cy={24} r={21} fill={c} /><Circle cx={24} cy={24} r={5} fill={bg} /></>),
  // Tělo nad hrazdou: kruh nad kupolí.
  rise: (c) => (<><Circle cx={24} cy={12} r={9} fill={c} /><Path d="M6 44 A18 18 0 0 1 42 44 Z" fill={c} /></>),
  // Široký nahoře, úzký dole.
  taper: (c) => (<><Circle cx={24} cy={17} r={15} fill={c} /><Circle cx={24} cy={41} r={6} fill={c} /></>),
  // Tři kruhy nad sebou: série.
  stack: (c) => (<><Circle cx={24} cy={8} r={7} fill={c} /><Circle cx={24} cy={24} r={7} fill={c} /><Circle cx={24} cy={40} r={7} fill={c} /></>),
  // Silný prstenec: úchop, obruč.
  ring: (c) => <Circle cx={24} cy={24} r={17} fill="none" stroke={c} strokeWidth={6} />,
  // Tři kruhy v trojúhelníku: všestrannost.
  trio: (c) => (<><Circle cx={24} cy={13} r={9} fill={c} /><Circle cx={13} cy={33} r={9} fill={c} /><Circle cx={35} cy={33} r={9} fill={c} /></>),
  // Obrácená rovnováha: těžiště dole, na rukou.
  inverted: (c) => (<><Circle cx={24} cy={15} r={11} fill="none" stroke={c} strokeWidth={2} /><Circle cx={24} cy={36} r={9} fill={c} /></>),
  // Kruh s oběžnicí: rozsah pohybu.
  orbit: (c) => (<><Circle cx={21} cy={27} r={14} fill={c} /><Circle cx={40} cy={9} r={5} fill={c} /></>),
  // Terč: pevný střed.
  core: (c, bg) => (<><Circle cx={24} cy={24} r={21} fill={c} /><Circle cx={24} cy={24} r={13} fill={bg} /><Circle cx={24} cy={24} r={7} fill={c} /></>),
  // Dva kruhy vedle sebe: vodorovné tělo, dvě ramena.
  pair: (c) => (<><Circle cx={13} cy={24} r={11} fill={c} /><Circle cx={35} cy={24} r={11} fill={c} /></>),
  // Kupole: nohy a základ.
  half: (c) => <Path d="M3 34 A21 21 0 0 1 45 34 Z" fill={c} />,
  // Přerušovaný obrys: prázdné místo pro vlastní vizi.
  custom: (c) => <Circle cx={24} cy={24} r={19} fill="none" stroke={c} strokeWidth={2} strokeDasharray="4 4" />,
};
