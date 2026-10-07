import { DecorCanvas } from '@/components/dots/DecorCanvas';
import { useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Points } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { lessonDone, motion } from '@/lib/motion';
import { dots } from '@/theme';
import { ripplePoints, wavePoints, type Pt } from './animate';
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
  /** Dotyková vlna (`useDotTouch`): souřadnice v rámci pole. Bez ní se pole nehýbe. */
  touch?: DotTouch;
  /** Vlna od středu pole (oslava): průběh 0–1, čelo vlny jde od středu do nejvzdálenějšího rohu. */
  wave?: SharedValue<number>;
  /** Odkud vlna `wave` vychází (výchozí střed pole); čelo dojde do nejvzdálenějšího rohu. */
  waveOrigin?: { x: number; y: number };
  /** Strop počtu teček (výchozí `dots.field.max`). Celoplošné pole oslavy ho zvedá, aby pokrylo obrazovku. */
  max?: number;
  /** Barvy teček místo `useDotInk` (stage-up na zlaté ploše: `goldDotOff` v klidu, `goldDotDim` pod prstem). */
  ink?: { off: string; on: string };
  /** Násobek krytí klidových teček (tlumené pozadí `ReactiveBackground`); rozjasnění pod prstem se netlumí. */
  restOpacity?: number;
  style?: StyleProp<ViewStyle>;
}

// Opacita pásem od plného k nejslabšímu (4 pásma = `dots.field.bands`).
const BAND_OPACITY = [1, 0.66, 0.38, 0.16] as const;
const RIPPLE = motion.ripple;
/** Šířka čela vlny od středu (pt). */
const BAND = lessonDone.waveBand;

/** Pole teček v pozadí (spec §2.4): `dotOff` na `base`/`tile`, vystředěné, bez dotyku statické.
 *  Počet teček je zastropovaný `dots.field.max` (výkon): navíc řádky se ořežou na straně, kam pole doznívá.
 *  Pohyb (motion-agent): dotyková vlna `touch` a vlna od středu `wave` posouvají tečky a rozjasněné kreslí
 *  navrch v `text`; vše v `useDerivedValue` na UI vlákně, bez React renderu. */
export function DotField({ width, height, pitch = dots.field.pitch, fade = 'none', touch, wave, waveOrigin, max = dots.field.max, ink: inkOverride, restOpacity = 1, style }: Props) {
  const themeInk = useDotInk();
  const ink = inkOverride ?? themeInk;
  const bands = useMemo(() => {
    if (width <= 0 || height <= 0) return [];
    const cols = Math.floor(width / pitch) + 1;
    const allRows = Math.floor(height / pitch) + 1;
    const rows = Math.max(1, Math.min(allRows, Math.floor(max / cols)));
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
    return out.map((pts, i) => ({ points: toPoints(pts, left, top) as Pt[], opacity: fade === 'none' ? 1 : BAND_OPACITY[i] ?? 0 }));
  }, [width, height, pitch, fade, max]);

  const base = useMemo(() => bands.map((b) => b.points), [bands]);
  const wx = waveOrigin ? waveOrigin.x : width / 2;
  const wy = waveOrigin ? waveOrigin.y : height / 2;
  const reach = Math.hypot(Math.max(wx, width - wx), Math.max(wy, height - wy));
  // Sdílené hodnoty doteku rozbalené mimo worklet (pravidlo no-worklet-object-capture).
  const tS = touch?.strength; const tX = touch?.x; const tY = touch?.y;
  // Jeden průchod pro všechna pásma: posunuté body po pásmech + společná rozjasněná vrstva.
  const moved = useDerivedValue(() => {
    const s = tS ? tS.value : 0;
    const w = wave ? wave.value : 0;
    const out: (readonly Pt[])[] = [];
    const lit: Pt[] = [];
    for (let i = 0; i < base.length; i++) {
      let pts: readonly Pt[] = base[i]!;
      if (w > 0 && w < 1) {
        const r = wavePoints(pts, wx, wy, w * (reach + BAND), BAND, RIPPLE.push);
        pts = r.pts;
        for (const q of r.lit) lit.push(q);
      }
      if (tX && tY && s > 0.001) {
        const r = ripplePoints(pts, tX.value, tY.value, s, RIPPLE.radius, RIPPLE.push);
        pts = r.pts;
        for (const q of r.lit) lit.push(q);
      }
      out.push(pts);
    }
    return { out, lit };
  });
  const litPoints = useDerivedValue(() => moved.value.lit);
  // Rozjasnění: síla doteku, u vlny od středu doznívá s jejím doběhem.
  const litOpacity = useDerivedValue(() => {
    const s = tS ? tS.value : 0;
    const w = wave ? wave.value : 0;
    return Math.max(s, w > 0 && w < 1 ? 1 - w * w : 0) * RIPPLE.lit;
  });

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width, height }, style]}>
      <SkiaGuard style={{ width, height }}>
        <DecorCanvas testID="dotfield-canvas" style={{ width, height }}>
          {bands.map((b, i) => (
            <BandPoints key={i} index={i} moved={moved} color={ink.off} opacity={b.opacity * restOpacity} strokeWidth={dots.field.r * 2} />
          ))}
          <Points points={litPoints} mode="points" color={ink.on} opacity={litOpacity} strokeWidth={dots.field.r * 2} strokeCap="round" />
        </DecorCanvas>
      </SkiaGuard>
    </View>
  );
}

function BandPoints({ index, moved, color, opacity, strokeWidth }: {
  index: number; moved: SharedValue<{ out: (readonly Pt[])[]; lit: Pt[] }>; color: string; opacity: number; strokeWidth: number;
}) {
  const points = useDerivedValue(() => (moved.value.out[index] ?? []) as Pt[]);
  return <Points points={points} mode="points" color={color} opacity={opacity} strokeWidth={strokeWidth} strokeCap="round" />;
}
