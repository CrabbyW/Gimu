import { useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, Points } from '@shopify/react-native-skia';
import { dots, stroke } from '@/theme';
import { gridDots } from './geometry';
import { glowPad, toPoints, useDotInk, type DotTouch } from './ink';
import { SkiaGuard } from './SkiaGuard';

interface Props {
  cols: number;
  rows: number;
  /** Rozsvícené buňky po řádcích (délka cols × rows; chybějící = zhasnuté). */
  lit: readonly boolean[];
  /** Index dnešní buňky: kolem tečky vlasový prstenec. */
  today?: number;
  /** Rozteč v pt (výchozí `dots.matrix.pitch`). */
  pitch?: number;
  /** Popisek pro čtečku (souhrn aktivity); bez něj dekorativní. */
  accessibilityLabel?: string;
  /** Místo pro dotykovou vlnu (motion-agent); staticky se nepoužije. */
  touch?: DotTouch;
}

/** Mřížka aktivity (obr. 2): zhasnuté tečky `dotOff`, aktivní větší v `text` se září (dark), dnešek s prstencem. */
export function DotMatrix({ cols, rows, lit, today, pitch = dots.matrix.pitch, accessibilityLabel }: Props) {
  const ink = useDotInk();
  const m = dots.matrix;
  const pad = glowPad(m.rLit * 2);
  const width = (cols - 1) * pitch + m.rLit * 2;
  const height = (rows - 1) * pitch + m.rLit * 2;
  const { on, off, todayAt } = useMemo(() => {
    const grid = gridDots(cols, rows, pitch);
    const o = pad + m.rLit;
    const t = today !== undefined ? grid[today] : undefined;
    return {
      on: toPoints(grid.filter((d) => lit[d.i]), o, o),
      off: toPoints(grid.filter((d) => !lit[d.i]), o, o),
      todayAt: t ? { x: t.x + o, y: t.y + o } : null,
    };
  }, [cols, rows, pitch, lit, today, pad, m.rLit]);
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  return (
    <View {...a11y} style={{ width, height }}>
      <SkiaGuard style={{ width, height }}>
        <Canvas testID="dotmatrix-canvas" pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: width + pad * 2, height: height + pad * 2 }}>
          <Points points={off} mode="points" color={ink.off} strokeWidth={m.r * 2} strokeCap="round" />
          {ink.glow && on.length > 0 ? (
            <Points points={on} mode="points" color={ink.glow} strokeWidth={m.rLit * 2 * dots.glow.scale} strokeCap="round">
              <BlurMask blur={dots.glow.blur} style="normal" />
            </Points>
          ) : null}
          <Points points={on} mode="points" color={ink.on} strokeWidth={m.rLit * 2} strokeCap="round" />
          {todayAt ? (
            <Circle cx={todayAt.x} cy={todayAt.y} r={m.rLit + m.todayGap} color={ink.on} style="stroke" strokeWidth={stroke.hairline} />
          ) : null}
        </Canvas>
      </SkiaGuard>
    </View>
  );
}
