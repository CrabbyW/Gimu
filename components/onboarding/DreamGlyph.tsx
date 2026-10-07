import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { DreamGlyphId } from '@/hooks/useOnboardingDraft';
import { dots } from '@/theme';
import { dotsPath, glyphDots } from './dotGlyph';

interface Props {
  glyph: DreamGlyphId;
  /** Barva teček (`muted`, u vybrané karty `text`). */
  color: string;
  /** Zachováno kvůli API; tečkový glyf otvory nekreslí výplní podkladu, jsou to prostě chybějící tečky. */
  bg?: string;
  size: number;
}

/** Tečkový glyf vize těla (Nothing Dot): tvar složený z teček, jedna SVG cesta. Dekorativní: význam nese text karty. */
export function DreamGlyph({ glyph, color, size }: Props) {
  const d = useMemo(() => dotsPath(glyphDots(glyph), dots.glyph.r), [glyph]);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg aria-hidden width={size} height={size} viewBox={`0 0 ${dots.glyph.view} ${dots.glyph.view}`}>
        <Path d={d} fill={color} />
      </Svg>
    </View>
  );
}
