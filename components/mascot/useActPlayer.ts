import { useEffect, useState } from 'react';
import { cancelAnimation, Easing, ReduceMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { repertoire } from '@/lib/motion';
import { ACT_CODE, ACT_SPEC, NO_ACT } from '@/lib/repertoireMotion';
import type { MascotPoseId } from '@/logic/mascotPoses';
import type { MascotAct } from './types';

/**
 * Přehrávač akce repertoáru v jedné opičce: osa `t` 0 → 1 za `ACT_SPEC.ms` lineárně na UI vlákně (choreografii
 * z ní skládá worklet), JS jen přepíná pózy akce časovačem (`ACT_SPEC.poses`). Nový `act.key` = přehrát znovu
 * (přeruší běžící akci), `null` = konec. Omezený pohyb: bez osy, jen první póza akce staticky `reducedMs`.
 * Haptiku řeší volající (`useMascotAct`), aby dvouvrstvá opička na mapě nebzučela dvakrát.
 */
export function useActPlayer(act: MascotAct | null | undefined, reduced: boolean) {
  const t = useSharedValue(0);
  const code = useSharedValue(NO_ACT);
  // Krok pózy (index v `ACT_SPEC.poses`) a konec akce patří klíči; setState jen z časovačů.
  const [step, setStep] = useState<{ key: number; idx: number } | null>(null);
  const [ended, setEnded] = useState<number | null>(null);
  const key = act?.key ?? null;
  const id = act?.id ?? null;

  useEffect(() => {
    cancelAnimation(t);
    code.set(NO_ACT);
    t.set(0);
    if (key === null || id === null) return;
    const spec = ACT_SPEC[id];
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (reduced) {
      timers.push(setTimeout(() => setEnded(key), repertoire.reducedMs));
      return () => timers.forEach(clearTimeout);
    }
    spec.poses.forEach(([at], idx) => {
      if (at > 0) timers.push(setTimeout(() => setStep({ key, idx }), at * spec.ms));
    });
    code.set(ACT_CODE[id]);
    t.set(withTiming(1, { duration: spec.ms, easing: Easing.linear, reduceMotion: ReduceMotion.Never }));
    timers.push(setTimeout(() => { code.set(NO_ACT); t.set(0); setEnded(key); }, spec.ms));
    return () => timers.forEach(clearTimeout);
    // Přehrává se jen novým klíčem; sdílené hodnoty jsou stabilní.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, id, reduced]);

  useEffect(() => () => { cancelAnimation(t); }, [t]);

  let pose: MascotPoseId | null = null;
  if (key !== null && id !== null && ended !== key) {
    const poses = ACT_SPEC[id].poses;
    // Omezený pohyb: první póza akce; jinak krok z časovače (na začátku poslední krok s `at` = 0).
    const idx = !reduced && step?.key === key ? step.idx : poses.reduce((m, [at], i) => (at === 0 ? i : m), -1);
    pose = idx >= 0 ? poses[idx]?.[1] ?? null : null;
  }
  return { t, code, pose };
}
