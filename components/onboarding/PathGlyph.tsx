import Svg, { Circle, Path } from 'react-native-svg';
import type { PathId } from '@/types';

interface Props { path: PathId; /** Barva tvaru (`text`, u vybrané karty `accent`). */ color: string; /** Barva podkladu karty, prosvítá otvorem kotouče. */ bg: string }

const SIZE = 48;

/** Geometrický glyf cesty ze skládaných kruhů (spec §7.1). Dekorativní: název cesty nese text karty. */
export function PathGlyph({ path, color, bg }: Props) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 48 48" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
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
  );
}
