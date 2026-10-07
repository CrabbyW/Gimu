import { useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { opacity, useTheme } from '@/theme';

/** Počet zrn v dlaždici (cca 1 zrno na 100 pt²): hustota litého povrchu, ne šum televize. */
const SPECKS = 92;

/** Deterministický pseudonáhodný rozptyl (LCG): stejné zrno při každém renderu i na všech zařízeních. */
function specks(tile: number) {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: SPECKS }, (_, i) => ({
    x: Math.floor(next() * tile),
    y: Math.floor(next() * tile),
    // Každé třetí zrno je dvojité (1×2 nebo 2×1): nepravidelnost litiny, ne mřížka pixelů.
    w: i % 3 === 0 && next() > 0.5 ? 2 : 1,
    h: i % 3 === 0 && next() <= 0.5 ? 2 : 1,
    light: next() > 0.55,
  }));
}

/**
 * Zrno lité litiny (hloubka a materiál, 2026-10-03): dlaždice `size.grainTile` se světlými (`text`) a tmavými
 * (`shadow`) zrny, celá vrstva na `opacity.grain` (5 %). Leží NAD obsahem obrazovky, bez dotyků a skrytá pro
 * čtečku: zrno je vlastnost materiálu, ne pozadí, takže prochází podkladem, kartami i hlavičkou stejně
 * (jako fyzický povrch). Světlá a tmavá zrna se vyrovnají, takže průměrný tón ani kontrast textu se nemění.
 */
export function Grain() {
  const { c, size } = useTheme();
  const id = `grain-${useId().replace(/[^\w-]/g, '')}`;
  const tile = size.grainTile;
  const dots = useMemo(() => specks(tile), [tile]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { opacity: opacity.grain }]}
    >
      <Svg aria-hidden width="100%" height="100%">
        <Defs>
          <Pattern id={id} width={tile} height={tile} patternUnits="userSpaceOnUse">
            {dots.map((d, i) => (
              <Rect key={i} x={d.x} y={d.y} width={d.w} height={d.h} fill={d.light ? c.text : c.shadow} />
            ))}
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
