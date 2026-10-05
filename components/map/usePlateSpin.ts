import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, cancelAnimation, useAnimatedReaction, useSharedValue, withDecay, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { DotTouch } from '@/components/dots';
import { fire } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';

const SPIN = motion.plateSpin;
const TAU = Math.PI * 2;
/** Strop úhlové rychlosti po puštění (rad/s): švih nesmí kotouč roztočit do rozmazané šmouhy. */
const MAX_VELOCITY = TAU * 2;
/** Nejkratší rozestup haptických tiků (ms): rychlý švih nesmí bzučet. */
const TICK_GAP_MS = 45;
/** Pod tímto poloměrem (podíl poloměru kotouče) je úhel prstu nestabilní: pohyb u středu kotouč netočí. */
const DEAD_CORE = 0.18;
const RELEASE = { duration: motion.ripple.decayMs, easing: Easing.out(Easing.quad) };

/** Nejkratší rozdíl úhlů `next − prev` v (−π, π]: přechod přes ±π nedá skok o celou otáčku. */
export function angleDelta(prev: number, next: number): number {
  'worklet';
  let d = (next - prev) % TAU;
  if (d > Math.PI) d -= TAU;
  else if (d <= -Math.PI) d += TAU;
  return d;
}

/** Kolik hranic po `stepDeg` stupních leží mezi úhly `fromDeg` a `toDeg` (oběma směry). */
export function ticksCrossed(fromDeg: number, toDeg: number, stepDeg: number): number {
  'worklet';
  return Math.abs(Math.floor(toDeg / stepDeg) - Math.floor(fromDeg / stepDeg));
}

const tick = () => fire('selection');

/**
 * Roztočení kotouče prstem (spec §4.2). Pan se aktivuje až po vodorovném posunu `activeOffset` a selže při
 * svislém `failOffsetY`, takže svislý scroll mapy vyhrává a tap (bez pohybu) dál patří `Pressable` uzlu.
 * Úhel prstu vůči středu kotouče (`size`) přičítá do `spin`; po puštění `withDecay` s úhlovou rychlostí
 * (deceleration `plateSpin.decay`) a kotouč plynule dojede zpět na ambientní rotaci (ta běží pod tím dál).
 * Haptický tik `selection` po každých `tickDeg` (z UI vlákna přes `scheduleOnRN`).
 * Navíc plní `touch` pro dotykovou vlnu teček kotouče (souřadnice uzlu).
 * Omezený pohyb nebo `enabled=false`: gesto vypnuté, `spin` stojí.
 */
export function usePlateSpin(enabled: boolean, size: number) {
  const { reduced } = useMotionSafe();
  const on = enabled && !reduced;
  const spin = useSharedValue(0);
  const velocity = useSharedValue(0);
  const last = useSharedValue(0);
  const spinning = useSharedValue(false);
  /** Poslední dotyk kotouč roztočil (pan se aktivoval): následné puštění není tap. Nový dotyk ho nuluje. */
  const dragged = useSharedValue(false);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const strength = useSharedValue(0);
  const lastTick = useSharedValue(0);
  const touch: DotTouch = useMemo(() => ({ x, y, strength }), [x, y, strength]);

  useAnimatedReaction(
    () => (spin.value * 180) / Math.PI,
    (deg, prev) => {
      if (prev === null) return;
      if (ticksCrossed(prev, deg, SPIN.tickDeg) === 0) return;
      const now = Date.now();
      if (now - lastTick.value < TICK_GAP_MS) return;
      lastTick.set(now);
      scheduleOnRN(tick);
    },
  );

  const gesture = useMemo(() => {
    const c = size / 2;
    const angleAt = (px: number, py: number) => {
      'worklet';
      return Math.atan2(py - c, px - c);
    };
    return Gesture.Pan()
      .enabled(on)
      .activeOffsetX([-SPIN.activeOffset, SPIN.activeOffset])
      .failOffsetY([-SPIN.failOffsetY, SPIN.failOffsetY])
      .shouldCancelWhenOutside(false)
      .onBegin((e) => {
        dragged.set(false);
        x.set(e.x);
        y.set(e.y);
        strength.set(withTiming(1, motion.press));
      })
      .onStart((e) => {
        cancelAnimation(spin);
        spinning.set(true);
        dragged.set(true);
        last.set(angleAt(e.x, e.y));
      })
      .onUpdate((e) => {
        x.set(e.x);
        y.set(e.y);
        const rx = e.x - c;
        const ry = e.y - c;
        if (Math.hypot(rx, ry) < c * DEAD_CORE) return;
        const a = angleAt(e.x, e.y);
        spin.set(spin.value + angleDelta(last.value, a));
        last.set(a);
        // Úhlová rychlost z tečné složky rychlosti prstu: ω = (r × v) / |r|².
        velocity.set((rx * e.velocityY - ry * e.velocityX) / Math.max(1, rx * rx + ry * ry));
      })
      .onEnd(() => {
        const v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity.value));
        spin.set(withDecay({ velocity: v, deceleration: SPIN.decay }, () => { spinning.set(false); }));
      })
      .onFinalize(() => {
        strength.set(withTiming(0, RELEASE));
      });
  // Sdílené hodnoty jsou stabilní.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, size]);

  return { gesture, spin, velocity, spinning, dragged, touch };
}
