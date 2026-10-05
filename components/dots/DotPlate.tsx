import { useMemo } from 'react';
import { View } from 'react-native';
import { Check, Lock } from 'lucide-react-native';
import { BlurMask, Canvas, Circle, Group, Points, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { dots, stroke, useTheme } from '@/theme';
import { plateDots } from './geometry';
import { glowPad, toPoints, useDotInk } from './ink';
import { SkiaGuard } from './SkiaGuard';

export type DotPlateState = 'locked' | 'current' | 'done';

interface Props {
  kg: number;
  /** Průměr v pt; vnější hrana teček leží přesně na size / 2 (kotva opičky, `plateOuterRadius`). */
  size: number;
  state: DotPlateState;
  /** Číslo kg uprostřed (výchozí ano; dokončený kotouč místo něj nese fajfku, pokud `check`). */
  showKg?: boolean;
  /** Dokončený: fajfka v otvoru (false = PlateNode ji dokreslí animovaně). */
  check?: boolean;
  /** Natočení teček v radiánech (motion-agent: ambientní rotace `motion.plateSpin` + roztočení prstem). */
  rotation?: SharedValue<number>;
  /** Úhel hlavy komety v radiánech vůči kotouči (jen `current`; motion-agent ji nechá obíhat). */
  comet?: SharedValue<number>;
  /** Kotouč je uvnitř ovládacího prvku s vlastním popiskem (uzel mapy): pro čtečku skrytý. */
  decorative?: boolean;
}

/** Poloměr tečky kotouče průměru `size`. */
export const plateDotRadius = (size: number) => Math.max(dots.plate.rMin, (size / 2) * dots.plate.rFrac);
/** Poloměr vnější hrany kotouče (= size / 2): sem si sedá opička (LessonMap `mascotSpot`). */
export const plateOuterRadius = (size: number) => size / 2;

// Výchozí (statická) poloha komety: 12 hodin. Na vnějším prstenci (48 teček) padne přesně na tečku.
const COMET_HOME = -Math.PI / 2;

/**
 * Kotouč z teček (spec §2.4): soustředné prstence, počet podle kg (2.5 → 2 … 25 → 7), vnitřní na náboji R/φ².
 * - zamčený: jen vnější prstenec `dotDim`, v otvoru zámek `muted`,
 * - aktuální: všechny prstence `text` se září (dark) a jasnější „kometa“ na vnějším prstenci,
 * - dokončený: plný `text` bez záře a bez komety, v otvoru fajfka.
 * Číslo kg stojí rovně (netočí se s tečkami): od průměru `dots.plate.dotoMin` Doto, menší uzly mono štítek
 * (Doto je povolené až od 28 pt a do náboje uzlu 72–88 by se nevešlo).
 */
export function DotPlate({ kg, size, state, showKg = true, check = true, rotation, comet, decorative = false }: Props) {
  const { c, size: tokens } = useTheme();
  const ink = useDotInk();
  const dotR = plateDotRadius(size);
  const pad = glowPad(dotR * 2 * dots.plate.cometScale);
  const box = size + pad * 2;
  const mid = box / 2;
  const geo = useMemo(() => {
    const all = plateDots(kg, size / 2 - dotR);
    const ring0 = all.filter((d) => d.ring === 0);
    return {
      outer: toPoints(ring0, mid, mid),
      inner: toPoints(all.filter((d) => d.ring > 0), mid, mid),
      ring0Count: ring0.length,
      ring0R: size / 2 - dotR,
    };
  }, [kg, size, dotR, mid]);
  // Natočení celé sady teček a komety; bez shared value stojí (statický vzhled, Reduce Motion).
  const spin = useDerivedValue(() => [{ rotate: rotation ? rotation.value : 0 }]);
  const cometSpin = useDerivedValue(() => [{ rotate: (rotation ? rotation.value : 0) + (comet ? comet.value : COMET_HOME) }]);

  const locked = state === 'locked';
  const lit = locked ? ink.dim : ink.on;
  const glow = state === 'current' ? ink.glow : null;
  const step = (2 * Math.PI) / geo.ring0Count;
  const tail = Array.from({ length: dots.plate.cometDots }, (_, k) => {
    const t = k / dots.plate.cometDots;
    return { a: -k * step, r: dotR * (dots.plate.cometScale - (dots.plate.cometScale - 1) * t), o: 1 - t };
  });

  const a11y = decorative
    ? { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
    : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: copy.dots.plateA11y(kg, copy.map.nodeState[state]) };
  const center = locked
    ? <Lock size={tokens.badgeIcon} color={c.muted} strokeWidth={stroke.icon} />
    : state === 'done' && check
      ? <Check size={tokens.lockIcon} color={c.text} strokeWidth={stroke.check} />
      : showKg
        ? <Text variant={size >= dots.plate.dotoMin ? 'dotStat' : 'label'} maxFontSizeMultiplier={1}>{kg}</Text>
        : null;

  return (
    <View {...a11y} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <SkiaGuard fallback={<FallbackRim size={size} locked={locked} />}>
        <Canvas testID="dotplate-canvas" pointerEvents="none" style={{ position: 'absolute', left: -pad, top: -pad, width: box, height: box }}>
          <Group transform={spin} origin={vec(mid, mid)}>
            {glow ? (
              <Points points={[...geo.outer, ...geo.inner]} mode="points" color={glow} strokeWidth={dotR * 2 * dots.glow.scale} strokeCap="round">
                <BlurMask blur={dots.glow.blur} style="normal" />
              </Points>
            ) : null}
            <Points points={geo.outer} mode="points" color={lit} strokeWidth={dotR * 2} strokeCap="round" />
            {locked ? null : <Points points={geo.inner} mode="points" color={lit} strokeWidth={dotR * 2} strokeCap="round" />}
          </Group>
          {state === 'current' ? (
            <Group transform={cometSpin} origin={vec(mid, mid)}>
              {tail.map((d, k) => (
                <Circle key={k} cx={mid + Math.cos(d.a) * geo.ring0R} cy={mid + Math.sin(d.a) * geo.ring0R} r={d.r} color={ink.on} opacity={d.o}>
                  {k === 0 && glow ? <BlurMask blur={dots.glow.blur / 2} style="solid" /> : null}
                </Circle>
              ))}
            </Group>
          ) : null}
        </Canvas>
      </SkiaGuard>
      {center}
    </View>
  );
}

/** Bez Skia (web bez CanvasKit): vlasový obrys kotouče, ať uzel mapy zůstane čitelný a klepnutelný. */
function FallbackRim({ size, locked }: { size: number; locked: boolean }) {
  const { c, radius } = useTheme();
  return (
    <View
      style={{
        position: 'absolute', width: size, height: size, borderRadius: radius.full,
        borderWidth: stroke.nodeRing, borderColor: locked ? c.dotDim : c.text,
      }}
    />
  );
}
