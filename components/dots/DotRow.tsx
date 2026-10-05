import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Points } from '@shopify/react-native-skia';
import { dots } from '@/theme';
import { rowLit } from './geometry';
import { glowPad, toPoints, useDotInk } from './ink';
import { SkiaGuard } from './SkiaGuard';

interface Props {
  /** Počet teček (např. lekce sekce, cviky lekce, dny série). */
  total: number;
  /** Rozsvícený podíl 0–1 (floor, ořezaný; NaN = nic). */
  fraction: number;
  /** Teček na řádek; víc teček se zalomí do dalších řádků (obr. 5: 12 × 2). Výchozí vše v jednom řádku. */
  columns?: number;
  /** Průměr tečky v pt (výchozí `dots.row.d`). */
  dot?: number;
  /** Popisek pro čtečku; bez něj je řádek dekorativní (číslo nese text vedle). */
  accessibilityLabel?: string;
}

/** Rozměr řádku pro layout (kvůli rezervaci místa i ve fallbacku bez Skia). */
export function dotRowSize(total: number, columns: number | undefined, dot: number = dots.row.d) {
  const cols = Math.max(1, Math.min(total, columns ?? total));
  const rows = Math.max(1, Math.ceil(total / cols));
  const pitch = dot + dots.row.gap;
  return { cols, rows, width: cols * pitch - dots.row.gap, height: rows * pitch - dots.row.gap };
}

/** Řádek progresu (obr. 5): k z N teček rozsvíceno v `text` (v dark se září), zbytek `dotOff`.
 *  Statický; nástup skenem zleva (`motion.dotScanMs`) přidá motion-agent. */
export function DotRow({ total, fraction, columns, dot = dots.row.d, accessibilityLabel }: Props) {
  const ink = useDotInk();
  const { cols, width, height } = dotRowSize(total, columns, dot);
  // Záře přesahuje tečku: plátno je o `pad` větší na všech stranách, layout drží čistý rozměr řádku.
  const pad = glowPad(dot);
  const { lit, off } = useMemo(() => {
    const flags = rowLit(total, fraction);
    const pitch = dot + dots.row.gap;
    const all = flags.map((on, i) => ({ on, x: (i % cols) * pitch + dot / 2, y: Math.floor(i / cols) * pitch + dot / 2 }));
    return { lit: toPoints(all.filter((d) => d.on), pad, pad), off: toPoints(all.filter((d) => !d.on), pad, pad) };
  }, [total, fraction, cols, dot, pad]);
  if (total <= 0) return null;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'progressbar' as const, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  return (
    <View {...a11y} style={{ width, height }}>
      <SkiaGuard style={{ width, height }}>
        <Canvas testID="dotrow-canvas" pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: width + pad * 2, height: height + pad * 2 }}>
          <Points points={off} mode="points" color={ink.off} strokeWidth={dot} strokeCap="round" />
          {ink.glow && lit.length > 0 ? (
            <Points points={lit} mode="points" color={ink.glow} strokeWidth={dot * dots.glow.scale} strokeCap="round">
              <BlurMask blur={dots.glow.blur} style="normal" />
            </Points>
          ) : null}
          <Points points={lit} mode="points" color={ink.on} strokeWidth={dot} strokeCap="round" />
        </Canvas>
      </SkiaGuard>
    </View>
  );
}
