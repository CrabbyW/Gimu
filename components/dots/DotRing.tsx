import { DecorCanvas } from '@/components/dots/DecorCanvas';
import { useEffect, useMemo, type ReactNode } from 'react';
import { View } from 'react-native';
import { BlurMask, Group, Points } from '@shopify/react-native-skia';
import { Easing, ReduceMotion, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import { dots, useTheme } from '@/theme';
import { ringDots, rowLit } from './geometry';
import { scanCount, type Pt } from './animate';
import { glowPad, toPoints, useDotInk } from './ink';
import { useDotReveal } from './useDotReveal';
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
  /** Nástup spirálou (`motion.dotScanMs`): vnější rastr se rozvine od středu ven, vnitřní prstenec doběhne
   *  od 12 hodin. Číslo = zpoždění v ms, false = stojí hned. Změny `progress` doběhnou plynule. */
  intro?: boolean | number;
  /** Na zlaté ploše stage-up: rozsvícené `onSeasonGold`, zhasnuté/tlumené tmavší zlato, bez záře. */
  onGold?: boolean;
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
 *  rozsvícený do `progress` v `text` (dark se září), zbytek `dotOff`. Nástup spirálou a plynulé změny (motion). */
export function DotRing({ progress, size, count = dots.ring.count, accessibilityLabel, children, intro = true, onGold = false }: Props) {
  const themeInk = useDotInk();
  const { c } = useTheme();
  const ink = onGold ? { on: c.onSeasonGold, off: c.goldDotOff, dim: c.goldDotDim, glow: null } : themeInk;
  const layout = useMemo(() => ringLayout(size, count), [size, count]);
  const pad = glowPad(layout.innerDot * 2);
  const { inner, outer, litCount } = useMemo(() => {
    const flags = rowLit(count, progress);
    const c = size / 2 + pad;
    return {
      inner: toPoints(layout.inner, c, c) as Pt[],
      outer: toPoints(layout.outer, c, c) as Pt[],
      litCount: flags.filter(Boolean).length,
    };
  }, [layout, count, progress, size, pad]);
  const { count: shown, fade } = useDotReveal(litCount, count, intro);
  // Vnější rastr: průběh 0 → 1 za `dotScanMs`, prstence od středu ven (pořadí `ringLayout`) = spirála.
  const { reduced } = useMotionSafe();
  const spiral = intro !== false && !reduced;
  const disc = useSharedValue(spiral ? 0 : 1);
  useEffect(() => {
    if (!spiral) return;
    disc.value = withDelay(typeof intro === 'number' ? intro : 0, withTiming(1, { duration: motion.dotScanMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
    // Nástup jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const outerShown = useDerivedValue(() => (disc.value >= 1 ? outer : outer.slice(0, Math.max(0, Math.floor(disc.value * outer.length)))));
  // Počet ořezaný do 0–count (první snímek animace na webu může dostat záporný čas).
  const lit = useDerivedValue(() => inner.slice(0, scanCount(shown.value / Math.max(1, count), count).whole));
  const off = useDerivedValue(() => inner.slice(scanCount(shown.value / Math.max(1, count), count).whole));
  const fresh = useDerivedValue(() => {
    const k = scanCount(shown.value / Math.max(1, count), count);
    const p = inner[k.whole];
    return k.frac > 0.001 && p ? [p] : [];
  });
  const freshOpacity = useDerivedValue(() => scanCount(shown.value / Math.max(1, count), count).frac);
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'progressbar' as const, accessibilityLabel }
    : {};
  return (
    <View {...a11y} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <SkiaGuard style={{ position: 'absolute', width: size, height: size }}>
        <DecorCanvas
          testID="dotring-canvas"
          pointerEvents="none"
          style={{ position: 'absolute', left: -pad, top: -pad, width: size + pad * 2, height: size + pad * 2 }}
        >
          <Group opacity={fade}>
            <Points points={outerShown} mode="points" color={ink.dim} strokeWidth={layout.outerDot * 2} strokeCap="round" />
            <Points points={off} mode="points" color={ink.off} strokeWidth={layout.innerDot * 2} strokeCap="round" />
            {ink.glow ? (
              <Points points={lit} mode="points" color={ink.glow} strokeWidth={layout.innerDot * 2 * dots.glow.scale} strokeCap="round">
                <BlurMask blur={dots.glow.blur} style="normal" />
              </Points>
            ) : null}
            <Points points={lit} mode="points" color={ink.on} strokeWidth={layout.innerDot * 2} strokeCap="round" />
            <Points points={fresh} mode="points" color={ink.on} opacity={freshOpacity} strokeWidth={layout.innerDot * 2} strokeCap="round" />
          </Group>
        </DecorCanvas>
      </SkiaGuard>
      {children}
    </View>
  );
}
