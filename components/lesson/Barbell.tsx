import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import { useTheme } from '@/theme';
import type { PlateKg } from '@/types';
import { AXIS, BARBELL_H, COLLAR, type BarbellLayout, type PlacedPlate } from './celebration';

/** Přílet jednoho kotouče. `drop` jde pružinou 0 → 1 (1 = na ose); `x` a `rotate` jsou odchylky od cílové polohy. */
export interface PlateFlight { drop: SharedValue<number>; x: SharedValue<number>; rotate: SharedValue<number> }

/** Výška, ze které kotouč padá (pt nad osou). */
export const DROP_FROM = 420;
// Přestřel pružiny za osu se kreslí zmenšený: kotouč jen „dosedne“ pár bodů pod osu a vrátí se,
// místo aby propadl o čtvrtinu výšky pádu (motion.snap přestřelí ~26 %).
const OVERSHOOT_SCALE = 0.1;

export interface BarbellMotion {
  right: PlateFlight;
  left: PlateFlight;
  /** Průhlednost přilétajících kotoučů (omezený pohyb: kotouč se jen prolne na místě). */
  opacity: SharedValue<number>;
  /** Odstup objímek od kotoučů v pt; 0 = zacvaknuto. */
  collar: SharedValue<number>;
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
        <Rect x={0} y={AXIS.y} width={width} height={AXIS.h} fill={c.plateRim} />
        <Rect x={0} y={AXIS.y} width={width} height={1} fill={c.plateHighlight} />
        {layout.loaded.map((p) => plateRect(p, 1))}
        {layout.loaded.map((p) => plateRect(p, -1))}
      </Svg>
      <FlyingPlate kg={f.kg} x={cx + f.offset} w={f.w} h={f.h} flight={motion.right} opacity={motion.opacity} />
      <FlyingPlate kg={f.kg} x={cx - f.offset - f.w} w={f.w} h={f.h} flight={motion.left} opacity={motion.opacity} />
      <Collar x={cx + layout.collarOffset} side={1} shift={motion.collar} />
      <Collar x={cx - layout.collarOffset - COLLAR.w} side={-1} shift={motion.collar} />
    </View>
  );
}

/** Kotouč z boku v souřadnicích činky: zaoblený obdélník s 1px světlem na levé hraně. */
function SidePlate({ kg, x, y, w, h }: { kg: PlateKg; x: number; y: number; w: number; h: number }) {
  const { c } = useTheme();
  return (
    <>
      <Rect x={x} y={y} width={w} height={h} rx={3} fill={c[`plate${kg}`]} />
      <Rect x={x} y={y + 3} width={1} height={h - 6} fill={c.plateHighlight} />
    </>
  );
}

interface FlyingProps { kg: PlateKg; x: number; w: number; h: number; flight: PlateFlight; opacity: SharedValue<number> }

function FlyingPlate({ kg, x, w, h, flight, opacity }: FlyingProps) {
  const style = useAnimatedStyle(() => {
    const d = flight.drop.value;
    const y = d <= 1 ? -DROP_FROM * (1 - d) : DROP_FROM * OVERSHOOT_SCALE * (d - 1);
    return {
      opacity: opacity.value,
      transform: [{ translateX: flight.x.value }, { translateY: y }, { rotate: `${flight.rotate.value}deg` }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: x, top: AXIS.mid - h / 2, width: w, height: h }, style]}>
      <Svg width={w} height={h}>
        <SidePlate kg={kg} x={0} y={0} w={w} h={h} />
      </Svg>
    </Animated.View>
  );
}

/** Objímka: před zacvaknutím stojí o `shift` dál od kotoučů (ven), při dopadu dojede k nim. */
function Collar({ x, side, shift }: { x: number; side: 1 | -1; shift: SharedValue<number> }) {
  const { c } = useTheme();
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: side * shift.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: x, top: AXIS.mid - COLLAR.h / 2, width: COLLAR.w, height: COLLAR.h, borderRadius: 2, backgroundColor: c.muted }, style]}
    />
  );
}
