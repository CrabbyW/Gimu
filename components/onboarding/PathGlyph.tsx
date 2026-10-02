import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/theme';
import type { PathId } from '@/types';

interface Props { path: PathId; /** Barva tvaru (`muted`, u vybrané karty `text`). */ color: string; /** Barva podkladu karty, prosvítá otvorem kotouče. */ bg: string }

// Rozměr glyfu je token `size.glyph`.

/** Geometrický glyf cesty ze skládaných kruhů (spec §7.1). Dekorativní: název cesty nese text karty. */
export function PathGlyph({ path, color, bg }: Props) {
  const SIZE = useTheme().size.glyph;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width={SIZE} height={SIZE} viewBox="0 0 48 48">
      {path === 'power' ? (
        // Kruh s vyříznutou výsečí 90°: směr, výbuch.
        <Path d="M24 24 L24 4 A20 20 0 1 1 4 24 Z" fill={color} />
      ) : path === 'bodyControl' ? (
        // Dva kruhy v rovnováze nad sebou.
        <>
          <Circle cx={24} cy={14} r={9} fill={color} />
          <Circle cx={24} cy={35} r={11} fill="none" stroke={color} strokeWidth={2} />
        </>
      ) : (
        // Plný těžký kotouč s otvorem.
        <>
          <Circle cx={24} cy={24} r={21} fill={color} />
          <Circle cx={24} cy={24} r={5} fill={bg} />
        </>
      )}
    </Svg>
    </View>
  );
}
