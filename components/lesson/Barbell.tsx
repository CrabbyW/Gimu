import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme';
import type { PlateKg } from '@/types';
import { AXIS, BARBELL_H, COLLAR, COLLAR_TRAVEL, SLEEVE, type BarbellLayout, type PlacedPlate } from './celebration';

const SHEEN = 'plateSheen';

/** Přílet jednoho kotouče.
 *  - `drop` 0 → 1: pád po oblouku (1 = dotek osy),
 *  - `seat`: dosednutí po dopadu v pt pod osou (pružina s rychlostí dopadu: kotouč se zaboří pár bodů
 *    a vrátí, bez odskoku nad osu),
 *  - `x`, `rotate`: odchylky od cílové polohy,
 *  - `collar`: odstup objímky této strany v pt (0 = zacvaknuto),
 *  - `heat`: žár kotouče 0–1 (akcent, IWF červená, přes litinu). Rozsvítí se v rámu dotyku osy a chladne; do té doby 0,
 *    takže scéna je až do dopadu monochromní. */
export interface PlateFlight {
  drop: SharedValue<number>;
  seat: SharedValue<number>;
  x: SharedValue<number>;
  rotate: SharedValue<number>;
  collar: SharedValue<number>;
  heat: SharedValue<number>;
}

/** Výška, ze které kotouč padá (pt nad osou). */
export const DROP_FROM = 420;

export interface BarbellMotion {
  right: PlateFlight;
  left: PlateFlight;
  /** Průhlednost přilétajících kotoučů (omezený pohyb: kotouč se jen prolne na místě). */
  opacity: SharedValue<number>;
}

interface Props { width: number; layout: BarbellLayout; motion: BarbellMotion }

/** Činka z boku: osa, nasazené kotouče zrcadlově na obě strany, přilétající kotouče a objímky v animované vrstvě. */
export function Barbell({ width, layout, motion }: Props) {
  const { c } = useTheme();
  const cx = width / 2;
  const plateRect = (p: PlacedPlate, side: 1 | -1) => {
    const x = side === 1 ? cx + p.offset : cx - p.offset - p.w;
    return <SidePlate key={`${side}-${p.offset}`} kg={p.kg} x={x} y={AXIS.mid - p.h / 2} w={p.w} h={p.h} />;
  };
  const f = layout.flying;
  return (
    <View style={{ width, height: BARBELL_H }}>
      <Svg width={width} height={BARBELL_H} style={StyleSheet.absoluteFill}>
        <SheenDefs />
        {/* Úchop: tenká osa uprostřed; na koncích silnější objímky za vnitřním dorazem. */}
        <Rect x={0} y={AXIS.mid - 3} width={width} height={6} rx={3} fill={c.plateRim} />
        {([1, -1] as const).map((side) => {
          const from = layout.sleeveOffset;
          const len = cx - from;
          const x = side === 1 ? cx + from : 0;
          const stopX = side === 1 ? cx + from : cx - from - SLEEVE.stopW;
          return (
            <Fragment key={side}>
              <Rect x={x} y={AXIS.mid - SLEEVE.h / 2} width={len} height={SLEEVE.h} rx={2} fill={c.plateRim} />
              <Rect x={x} y={AXIS.mid - SLEEVE.h / 2} width={len} height={1} fill={c.plateHighlight} />
              <Rect x={stopX} y={AXIS.mid - SLEEVE.stopH / 2} width={SLEEVE.stopW} height={SLEEVE.stopH} rx={2} fill={c.muted} />
            </Fragment>
          );
        })}
        {layout.loaded.map((p) => plateRect(p, 1))}
        {layout.loaded.map((p) => plateRect(p, -1))}
      </Svg>
      <FlyingPlate kg={f.kg} x={cx + f.offset} w={f.w} h={f.h} flight={motion.right} opacity={motion.opacity} />
      <FlyingPlate kg={f.kg} x={cx - f.offset - f.w} w={f.w} h={f.h} flight={motion.left} opacity={motion.opacity} />
      <Collar x={cx + layout.collarOffset} side={1} shift={motion.right.collar} />
      <Collar x={cx - layout.collarOffset - COLLAR.w} side={-1} shift={motion.left.collar} />
    </View>
  );
}

/** Válcové stínování hrany kotouče: světlo vlevo nahoře, stín dole (gradient dělá hloubku, ne dekoraci). */
function SheenDefs() {
  const { c } = useTheme();
  return (
    <Defs>
      <LinearGradient id={SHEEN} x1="0" y1="0" x2="0.35" y2="1">
        <Stop offset="0" stopColor={c.plateHighlight} stopOpacity={1} />
        <Stop offset="0.45" stopColor={c.plateHighlight} stopOpacity={0} />
        <Stop offset="1" stopColor={c.plateShade} stopOpacity={1} />
      </LinearGradient>
    </Defs>
  );
}

/** Kotouč z boku v souřadnicích činky: zaoblený obdélník, válcové světlo a 1px hrana vlevo. */
function SidePlate({ kg, x, y, w, h }: { kg: PlateKg; x: number; y: number; w: number; h: number }) {
  const { c } = useTheme();
  return (
    <>
      <Rect x={x} y={y} width={w} height={h} rx={3} fill={c[`plate${kg}`]} />
      <Rect x={x} y={y} width={w} height={h} rx={3} fill={`url(#${SHEEN})`} />
      <Rect x={x + 1} y={y + 4} width={1} height={h - 8} fill={c.plateHighlight} />
    </>
  );
}

interface FlyingProps { kg: PlateKg; x: number; w: number; h: number; flight: PlateFlight; opacity: SharedValue<number> }

function FlyingPlate({ kg, x, w, h, flight, opacity }: FlyingProps) {
  const { c } = useTheme();
  const style = useAnimatedStyle(() => {
    const y = -DROP_FROM * (1 - flight.drop.value) + flight.seat.value;
    return {
      opacity: opacity.value,
      transform: [{ translateX: flight.x.value }, { translateY: y }, { rotate: `${flight.rotate.value}deg` }],
    };
  });
  const heatStyle = useAnimatedStyle(() => ({ opacity: flight.heat.value }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: AXIS.mid - h / 2, width: w, height: h }, style]}>
      <Svg width={w} height={h}>
        <SheenDefs />
        <SidePlate kg={kg} x={0} y={0} w={w} h={h} />
      </Svg>
      {/* Žár dopadu: akcent přes kotouč (stejný tvar), chladne do litiny. */}
      <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 3, backgroundColor: c.accent }, heatStyle]} />
    </Animated.View>
  );
}

/** Objímka: před zacvaknutím čeká neviditelná o `shift` dál od kotoučů (ven), aby se nekřížila s letícím
 *  kotoučem; při dopadu dojede k němu a zároveň se objeví (průhlednost je odvozená z odstupu). */
function Collar({ x, side, shift }: { x: number; side: 1 | -1; shift: SharedValue<number> }) {
  const { c, material } = useTheme();
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(shift.value, [0, COLLAR_TRAVEL], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: side * shift.value }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x, top: AXIS.mid - COLLAR.h / 2, width: COLLAR.w, height: COLLAR.h, borderRadius: material.collarRadius, backgroundColor: c.muted }, style]}
    />
  );
}
