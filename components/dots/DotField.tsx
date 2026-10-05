import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Points } from '@shopify/react-native-skia';
import { dots } from '@/theme';
import { gridDots } from './geometry';
import { toPoints, useDotInk, type DotTouch } from './ink';
import { SkiaGuard } from './SkiaGuard';

export type DotFieldFade = 'none' | 'down' | 'up';

interface Props {
  width: number;
  height: number;
  /** Rozteč v pt (výchozí 14, spec §2.4). */
  pitch?: number;
  /** Doznívání v pásmech: `down` = pole slábne směrem dolů (pozadí hlavičky), `up` = slábne nahoru (podlaha). */
  fade?: DotFieldFade;
  /** Dotyková vlna (motion-agent, `useDotTouch`). Staticky se pole nehýbe. */
  touch?: DotTouch;
  style?: StyleProp<ViewStyle>;
}

// Opacita pásem od plného k nejslabšímu (4 pásma = `dots.field.bands`).
const BAND_OPACITY = [1, 0.66, 0.38, 0.16] as const;

/** Pole teček v pozadí (spec §2.4): `dotOff` na `base`/`tile`, vystředěné, bez dotyku statické.
 *  Počet teček je zastropovaný `dots.field.max` (výkon): navíc řádky se ořežou na straně, kam pole doznívá. */
export function DotField({ width, height, pitch = dots.field.pitch, fade = 'none', style }: Props) {
  const ink = useDotInk();
  const bands = useMemo(() => {
    if (width <= 0 || height <= 0) return [];
    const cols = Math.floor(width / pitch) + 1;
    const allRows = Math.floor(height / pitch) + 1;
    const rows = Math.max(1, Math.min(allRows, Math.floor(dots.field.max / cols)));
    const left = (width - (cols - 1) * pitch) / 2;
    // Pole „up“ (podlaha) sedí dole: ořezané řádky chybí nahoře.
    const top = fade === 'up' ? height - (rows - 1) * pitch - (height - (allRows - 1) * pitch) / 2 : (height - (allRows - 1) * pitch) / 2;
    const grid = gridDots(cols, rows, pitch);
    const n = fade === 'none' ? 1 : dots.field.bands;
    const out = Array.from({ length: n }, () => [] as { x: number; y: number }[]);
    for (const d of grid) {
      const r = Math.floor(d.i / cols);
      // Pásmo podle řádku: `down` 0 nahoře, `up` 0 dole.
      const t = fade === 'up' ? rows - 1 - r : r;
      out[Math.min(n - 1, Math.floor((t / rows) * n))]!.push(d);
    }
    return out.map((pts, i) => ({ points: toPoints(pts, left, top), opacity: fade === 'none' ? 1 : BAND_OPACITY[i] ?? 0 }));
  }, [width, height, pitch, fade]);
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width, height }, style]}>
      <SkiaGuard style={{ width, height }}>
        <Canvas testID="dotfield-canvas" style={{ width, height }}>
          {bands.map((b, i) => (
            <Points key={i} points={b.points} mode="points" color={ink.off} opacity={b.opacity} strokeWidth={dots.field.r * 2} strokeCap="round" />
          ))}
        </Canvas>
      </SkiaGuard>
    </View>
  );
}
