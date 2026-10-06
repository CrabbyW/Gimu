import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Points } from '@shopify/react-native-skia';
import { GestureDetector } from 'react-native-gesture-handler';
import { Easing, ReduceMotion, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import { dots, stroke } from '@/theme';
import { gridDots } from './geometry';
import { ripplePoints, scanOrder, type Pt } from './animate';
import { glowPad, toPoints, useDotInk, type DotTouch } from './ink';
import { useDotTouch } from './useDotTouch';
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
  /** Dotyková vlna zvenčí (souřadnice v rámci mřížky). Bez ní si mřížka vlnu obstará sama (vlastní gesto). */
  touch?: DotTouch;
  /** Nástup skenem zleva (`motion.dotScanMs`), číslo = zpoždění v ms; false = stojí hned. */
  intro?: boolean | number;
}

/** Mřížka aktivity (obr. 2): zhasnuté tečky `dotOff`, aktivní větší v `text` se září (dark), dnešek s prstencem. */
export function DotMatrix({ cols, rows, lit, today, pitch = dots.matrix.pitch, accessibilityLabel, touch, intro = true }: Props) {
  const ink = useDotInk();
  const m = dots.matrix;
  const pad = glowPad(m.rLit * 2);
  const width = (cols - 1) * pitch + m.rLit * 2;
  const height = (rows - 1) * pitch + m.rLit * 2;
  const { on, off, todayAt, onRank, n } = useMemo(() => {
    const grid = gridDots(cols, rows, pitch);
    const o = pad + m.rLit;
    const t = today !== undefined ? grid[today] : undefined;
    // Sken zleva: pořadí podle sloupce; rank každé tečky v rámci celé mřížky.
    const rank = new Array<number>(grid.length);
    scanOrder(grid).forEach((idx, r) => { rank[idx] = r; });
    const onIdx = grid.filter((d) => lit[d.i]);
    const offIdx = grid.filter((d) => !lit[d.i]);
    return {
      on: toPoints(onIdx, o, o) as Pt[],
      off: toPoints(offIdx, o, o) as Pt[],
      onRank: onIdx.map((d) => rank[d.i]!),
      n: grid.length,
      todayAt: t ? { x: t.x + o, y: t.y + o } : null,
    };
  }, [cols, rows, pitch, lit, today, pad, m.rLit]);

  // Vlastní dotyková vlna, pokud ji nedodá rodič (např. dlaždice s vlastním gestem).
  const own = useDotTouch(!touch);
  const tt = touch ?? own.touch;
  // Sdílené hodnoty doteku rozbalené mimo worklet (pravidlo no-worklet-object-capture).
  const { strength: tS, x: tX, y: tY } = tt;
  const { reduced } = useMotionSafe();
  const play = intro !== false;
  const scan = play && !reduced;
  const reveal = useSharedValue(play ? 0 : 1);
  useEffect(() => {
    if (!play) return;
    const cfg = reduced ? motion.calmFade : { duration: motion.dotScanMs, easing: Easing.linear };
    reveal.value = withDelay(typeof intro === 'number' ? intro : 0, withTiming(1, { ...cfg, reduceMotion: ReduceMotion.Never }));
    // Nástup jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fade = useDerivedValue(() => (scan ? 1 : reveal.value));
  const layers = useDerivedValue(() => {
    let a: readonly Pt[] = on;
    let b: readonly Pt[] = off;
    if (scan && reveal.value < 1) {
      // Zhasnuté tečky jsou podklad (stojí hned), rozsvícené přibývají zleva.
      const k = reveal.value * n;
      a = on.filter((_, i) => onRank[i]! < k);
    }
    const s = tS.value;
    if (s <= 0.001) return { on: a, off: b, lit: [] as Pt[] };
    // Plátno je posunuté o `pad`: prst v souřadnicích mřížky → souřadnice plátna.
    const fx = tX.value + pad;
    const fy = tY.value + pad;
    const ra = ripplePoints(a, fx, fy, s, motion.ripple.radius, motion.ripple.push);
    const rb = ripplePoints(b, fx, fy, s, motion.ripple.radius, motion.ripple.push);
    a = ra.pts;
    b = rb.pts;
    return { on: a, off: b, lit: rb.lit };
  });
  const onPts = useDerivedValue(() => layers.value.on as Pt[]);
  const offPts = useDerivedValue(() => layers.value.off as Pt[]);
  const litPts = useDerivedValue(() => layers.value.lit);
  const litOpacity = useDerivedValue(() => tS.value * motion.ripple.lit);
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };
  const body = (
    <View {...a11y} style={{ width, height }}>
      <SkiaGuard style={{ width, height }}>
        <Canvas testID="dotmatrix-canvas" pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: width + pad * 2, height: height + pad * 2 }}>
          <Group opacity={fade}>
            <Points points={offPts} mode="points" color={ink.off} strokeWidth={m.r * 2} strokeCap="round" />
            {/* Rozjasnění zhasnutých teček u prstu: vrstva `text` přes `dotOff`. */}
            <Points points={litPts} mode="points" color={ink.on} opacity={litOpacity} strokeWidth={m.r * 2} strokeCap="round" />
            {ink.glow && on.length > 0 ? (
              <Points points={onPts} mode="points" color={ink.glow} strokeWidth={m.rLit * 2 * dots.glow.scale} strokeCap="round">
                <BlurMask blur={dots.glow.blur} style="normal" />
              </Points>
            ) : null}
            <Points points={onPts} mode="points" color={ink.on} strokeWidth={m.rLit * 2} strokeCap="round" />
            {todayAt ? (
              <Circle cx={todayAt.x} cy={todayAt.y} r={m.rLit + m.todayGap} color={ink.on} style="stroke" strokeWidth={stroke.hairline} />
            ) : null}
          </Group>
        </Canvas>
      </SkiaGuard>
    </View>
  );
  return touch ? body : <GestureDetector gesture={own.gesture}>{body}</GestureDetector>;
}
