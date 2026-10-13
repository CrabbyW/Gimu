import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import Animated, {
  Easing, ReduceMotion, cancelAnimation, useAnimatedReaction, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Mascot } from '@/components/mascot';
import { size } from '@/theme/tokens';
import { feedback } from '@/lib/feedback';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import type { MascotStage } from '@/types';

const P = motion.pullRefresh;
// Čísla mimo workletů (worklet zachytává jen čísla a sdílené hodnoty).
const { slop: SLOP, resist: RESIST, max: MAX, threshold: THRESHOLD, rest: REST, dragTurns: TURNS, spinMs: SPIN_MS, hideMs: HIDE_MS, parkMs: PARK_MS, pulseMs: PULSE_MS, pulseLow: PULSE_LOW } = P;
const RATIO = motion.scrollIntent.verticalRatio;
const NEVER = ReduceMotion.Never;
const HEAD = size.pullHead;
const NO_COSMETICS = {};

export interface PullRefresh {
  /** Gesto do kořenové `Gesture.Simultaneous` obrazovky (a jako souběžné k nativnímu scrollu mapy). */
  gesture: ReturnType<typeof Gesture.Manual>;
  /** Posun obsahu mapy (pt, ≥ 0): tah s odporem, při načítání `rest`. */
  pull: SharedValue<number>;
  /** 1 = data se obnovují (hlava se točí), 0 = klid. */
  refreshing: SharedValue<number>;
  /** Scroll mapy (vnitřní souřadnice): tah se chytí jen na začátku mapy (≤ 0). */
  scrollY: SharedValue<number>;
}

/**
 * Pull-to-refresh mapy: vlastní implementace nad scroll offsetem a dotyky (ne RefreshControl: ten na Androidu
 * nejde přestylovat a na webu neexistuje). Ruční gesto se aktivuje jen na začátku mapy (scroll ≤ 0) při jasně
 * svislém tahu dolů; jinak hned selže a scroll, tečky ani roztočení kotouče neruší. Obnova dat běží v JS
 * (`onRefresh`, obnova přes hooky), indikátor se schová až po jejím konci a nejdřív po `minSpinMs`.
 * Ve workletech jen sdílené hodnoty a čísla; JS funkce jde přes `scheduleOnRN` se stabilní identitou.
 */
export function usePullRefresh(onRefresh: () => Promise<unknown>): PullRefresh {
  const pull = useSharedValue(0);
  const refreshing = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);
  const active = useSharedValue(0);
  const armed = useSharedValue(0);
  // Puštění nad prahem pošle z UI vlákna nové číslo obnovy (setState je stabilní funkce, žádný ref ve workletu).
  const seq = useSharedValue(0);
  const [ticket, setTicket] = useState(0);
  // JS: obnova dat → počkat aspoň `minSpinMs` od puštění → schovat. Chyba obnovy indikátor taky schová
  // (chybový stav ukáže obrazovka sama).
  useEffect(() => {
    if (ticket === 0) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const t0 = Date.now();
    const finish = () => {
      if (!alive) return;
      timer = setTimeout(() => {
        refreshing.set(0);
        pull.set(withTiming(0, { duration: P.hideMs, easing: ease.out, reduceMotion: NEVER }));
      }, Math.max(0, P.minSpinMs - (Date.now() - t0)));
    };
    onRefresh().then(finish, finish);
    return () => { alive = false; if (timer) clearTimeout(timer); };
    // Jedna obnova na jedno puštění (`ticket`); `onRefresh` je čerstvý z renderu, ve kterém ticket přišel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket]);

  const gesture = useMemo(() => Gesture.Manual()
    .shouldCancelWhenOutside(false)
    .onTouchesDown((e, manager) => {
      const t = e.allTouches[0];
      // Jen jeden prst, na začátku mapy a mimo běžící obnovu.
      if (!t || e.numberOfTouches > 1 || scrollY.get() > 0.5 || refreshing.get() > 0) { manager.fail(); return; }
      sx.set(t.absoluteX);
      sy.set(t.absoluteY);
      active.set(0);
      armed.set(0);
    })
    .onTouchesMove((e, manager) => {
      const t = e.allTouches[0];
      if (!t) return;
      const dx = t.absoluteX - sx.get();
      const dy = t.absoluteY - sy.get();
      if (active.get() === 0) {
        if (dx * dx + dy * dy < SLOP * SLOP) return;
        if (dy > 0 && dy > RATIO * Math.abs(dx) && scrollY.get() <= 0.5) { active.set(1); manager.activate(); } else { manager.fail(); return; }
      }
      const shown = Math.min(MAX, Math.max(0, dy - SLOP) * RESIST);
      pull.set(shown);
      if (shown >= THRESHOLD && armed.get() === 0) { armed.set(1); scheduleOnRN(feedback, 'pullArm'); }
      else if (shown < THRESHOLD && armed.get() === 1) armed.set(0);
    })
    .onTouchesUp((e, manager) => { if (e.numberOfTouches <= 1) manager.end(); })
    .onTouchesCancelled((_e, manager) => { manager.fail(); })
    .onFinalize(() => {
      if (active.get() === 0) return;
      active.set(0);
      if (armed.get() === 1) {
        armed.set(0);
        refreshing.set(1);
        pull.set(withTiming(REST, { duration: PARK_MS, easing: ease.out, reduceMotion: NEVER }));
        seq.set(seq.get() + 1);
        scheduleOnRN(setTicket, seq.get());
      } else {
        pull.set(withTiming(0, { duration: HIDE_MS, easing: ease.out, reduceMotion: NEVER }));
      }
    }),
  // Sdílené hodnoty a `setTicket` jsou stabilní.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  []);
  return { gesture, pull, refreshing, scrollY };
}

/**
 * Indikátor: opičí hlava (póza `loading`: hlava bez těla, 12 teček kolem, horní živá) v mezeře, kterou tah
 * otevře pod hlavičkou. Při tahu se vynoří (opacita a zdvih podle tahu) a natáčí úměrně tahu, při obnově se točí
 * `spinMs` na otáčku. Omezený pohyb: bez rotace, jen prolnutí a při obnově pulz opacity.
 */
export function PullIndicator({ pull, refreshing, top, width, stage }: {
  pull: SharedValue<number>; refreshing: SharedValue<number>; top: number; width: number; stage: MascotStage;
}) {
  const { reduced } = useMotionSafe();
  const spin = useSharedValue(0);
  const pulse = useSharedValue(1);
  const R = reduced ? 1 : 0;
  // Smyčka podle `refreshing` na UI vlákně (bez JS): točení, s omezeným pohybem pulz opacity.
  useAnimatedReaction(() => refreshing.get(), (on, prev) => {
    if (on === prev) return;
    if (on > 0) {
      if (R === 1) {
        pulse.set(withRepeat(withSequence(
          withTiming(PULSE_LOW, { duration: PULSE_MS / 2, easing: ease.inOut, reduceMotion: NEVER }),
          withTiming(1, { duration: PULSE_MS / 2, easing: ease.inOut, reduceMotion: NEVER }),
        ), -1));
      } else {
        spin.set(0);
        spin.set(withRepeat(withTiming(360, { duration: SPIN_MS, easing: Easing.linear, reduceMotion: NEVER }), -1));
      }
    } else if (prev !== null) {
      // Konec: točení dojede plynule do celé otáčky během schování, pulz se vrátí na plnou.
      cancelAnimation(spin);
      cancelAnimation(pulse);
      pulse.set(withTiming(1, { duration: HIDE_MS, easing: ease.out, reduceMotion: NEVER }));
    }
  });
  const loopStyle = useAnimatedStyle(() => {
    const p = pull.get();
    const k = Math.min(1, p / REST);
    const turn = R === 1 ? 0 : k * TURNS * 360 + spin.get();
    return {
      opacity: k * pulse.get(),
      transform: [{ translateY: (p - HEAD) / 2 + (1 - k) * -8 }, { rotate: `${turn}deg` }, { scale: 0.7 + 0.3 * k }],
    };
  });
  return (
    <View
      pointerEvents="none"
      // Dekorativní: obnovu ohlásí čtečce až nová data; indikátor je jen znázornění.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: (width - HEAD) / 2, top, width: HEAD, height: HEAD }}
    >
      <Animated.View testID="map-refresh" style={[{ width: HEAD, height: HEAD }, loopStyle]}>
        <Mascot stage={stage} mood="idle" pose="loading" size={HEAD} cosmetics={NO_COSMETICS} decorative hop={false} still />
      </Animated.View>
    </View>
  );
}
