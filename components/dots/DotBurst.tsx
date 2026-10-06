import { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Group, Points, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { motion } from '@/lib/motion';
import { ringLayout } from './DotRing';
import { SkiaGuard } from './SkiaGuard';

interface Props {
  /** Průměr prstence, který se rozpadá (stejný jako `DotRing`). */
  size: number;
  /** Průběh rozpadu 0 → 1 (řídí volající na UI vlákně). */
  progress: SharedValue<number>;
  /** Barva teček (obvykle inkoust rozsvícených teček). */
  color: string;
}

const B = motion.dotBurst;

/**
 * Rozpad `DotRing` na tečky (motion-agent): na stejných místech jako prstenec, tečky odletí radiálně ven
 * s rozptylem a dohasnou. Vnitřní prstenec letí `inner` × poloměr, vnější rastr dál (`outer`). Jedno plátno,
 * pozice počítá worklet z `progress`. Volající ve stejném okamžiku skryje skutečný `DotRing`.
 */
export function DotBurst({ size, progress, color }: Props) {
  const geo = useMemo(() => {
    const L = ringLayout(size);
    // Deterministický rozptyl (bez Math.random): stejný průběh při každém přehrání.
    const spread = (i: number) => 1 + B.jitter * Math.sin(i * 12.9898);
    const pts = [
      ...L.inner.map((p, i) => ({ x: p.x, y: p.y, k: B.inner * spread(i) })),
      ...L.outer.map((p, i) => ({ x: p.x, y: p.y, k: B.outer * spread(i + 7) })),
    ];
    return { inner: pts.slice(0, L.inner.length), outer: pts.slice(L.inner.length), innerD: L.innerDot * 2, outerD: L.outerDot * 2 };
  }, [size]);
  const fly = (list: { x: number; y: number; k: number }[]) => {
    'worklet';
    const t = progress.value;
    return list.map((p) => {
      const f = 1 + p.k * t;
      return vec(size / 2 + p.x * f, size / 2 + p.y * f);
    });
  };
  const inner = useDerivedValue(() => fly(geo.inner));
  const outer = useDerivedValue(() => fly(geo.outer));
  const opacity = useDerivedValue(() => (progress.value <= 0 ? 0 : 1 - progress.value));
  const pad = size * B.outer;
  const box = size + pad * 2;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: box, height: box }}>
      <SkiaGuard style={{ width: box, height: box }}>
        <Canvas style={{ width: box, height: box }}>
          <Group opacity={opacity} transform={[{ translateX: pad }, { translateY: pad }]}>
            <Points points={outer} mode="points" color={color} strokeWidth={geo.outerD} strokeCap="round" />
            <Points points={inner} mode="points" color={color} strokeWidth={geo.innerD} strokeCap="round" />
          </Group>
        </Canvas>
      </SkiaGuard>
    </View>
  );
}
