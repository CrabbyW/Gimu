import { useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Points } from '@shopify/react-native-skia';
import { dots } from '@/theme';
import { ringDots, rowLit } from './geometry';
import { glowPad, toPoints, useDotInk } from './ink';
import { SkiaGuard } from './SkiaGuard';

interface Props {
  /** Rozsvícený podíl vnitřního prstence 0–1, od 12 hodin po směru hodinových ručiček. */
  progress: number;
  /** Průměr v pt. */
  size: number;
  /** Počet teček vnitřního prstence (výchozí `dots.ring.count`). */
  count?: number;
  /** Popisek pro čtečku; bez něj dekorativní (číslo nese obsah uprostřed). */
  accessibilityLabel?: string;
  /** Obsah uprostřed (číslo, odpočet). */
  children?: ReactNode;
}

/** Geometrie prstence: vnitřní tečky (start nahoře) a vnější rozptýlený disk. Exportované pro motion (spirála). */
export function ringLayout(size: number, count: number = dots.ring.count) {
  const R = size / 2;
  const g = dots.ring;
  const inner = ringDots(count, R * g.inner, -Math.PI / 2);
  const outer: { x: number; y: number }[] = [];
  const pitch = R * g.outerPitch;
  for (let r = R * g.outerFrom; r <= R - R * g.outerDot; r += pitch) {
    const n = Math.max(8, Math.round((2 * Math.PI * r) / pitch));
    // Každý druhý prstenec pootočený o půl rozteče: disk se čte jako rastr, ne jako soustředné kruhy.
    outer.push(...ringDots(n, r, ((Math.round(r / pitch) % 2) * Math.PI) / n));
  }
  return { inner, outer, innerDot: R * g.innerDot, outerDot: R * g.outerDot };
}

/** Progresový prstenec (obr. 3): rastr drobných teček `dotDim` kolem a uvnitř prstenec většich teček,
 *  rozsvícený do `progress` v `text` (dark se září), zbytek `dotOff`. Statický; spirálový nástup dělá motion. */
export function DotRing({ progress, size, count = dots.ring.count, accessibilityLabel, children }: Props) {
  const ink = useDotInk();
  const layout = useMemo(() => ringLayout(size, count), [size, count]);
  const pad = glowPad(layout.innerDot * 2);
  const { lit, off, outer } = useMemo(() => {
    const flags = rowLit(count, progress);
    const c = size / 2 + pad;
    return {
      lit: toPoints(layout.inner.filter((_, i) => flags[i]), c, c),
      off: toPoints(layout.inner.filter((_, i) => !flags[i]), c, c),
      outer: toPoints(layout.outer, c, c),
    };
  }, [layout, count, progress, size, pad]);
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'progressbar' as const, accessibilityLabel }
    : {};
  return (
    <View {...a11y} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <SkiaGuard style={{ position: 'absolute', width: size, height: size }}>
        <Canvas
          testID="dotring-canvas"
          pointerEvents="none"
          style={{ position: 'absolute', left: -pad, top: -pad, width: size + pad * 2, height: size + pad * 2 }}
        >
          <Points points={outer} mode="points" color={ink.dim} strokeWidth={layout.outerDot * 2} strokeCap="round" />
          <Points points={off} mode="points" color={ink.off} strokeWidth={layout.innerDot * 2} strokeCap="round" />
          {ink.glow && lit.length > 0 ? (
            <Points points={lit} mode="points" color={ink.glow} strokeWidth={layout.innerDot * 2 * dots.glow.scale} strokeCap="round">
              <BlurMask blur={dots.glow.blur} style="normal" />
            </Points>
          ) : null}
          <Points points={lit} mode="points" color={ink.on} strokeWidth={layout.innerDot * 2} strokeCap="round" />
        </Canvas>
      </SkiaGuard>
      {children}
    </View>
  );
}
