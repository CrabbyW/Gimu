import { useEffect, useRef } from 'react';
import {
  type SharedValue, cancelAnimation, Easing, useDerivedValue, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { ease, mascotPose as MP } from '@/lib/motion';
import { applyLife, bezierOut, LIFE_CLOCK_MS, mixVector, POSE_CODE, poseVector, WAVE_MS } from '@/lib/poseMotion';
import { applyAct, applyTrain } from '@/lib/repertoireMotion';
import { MASCOT_POSES, type MascotPoseId } from '@/logic/mascotPoses';
import { EYE_DROP, EYE_RY } from './monkeyGeometry';

const EYES = { ry: EYE_RY, drop: EYE_DROP };

/**
 * Póza opice na UI vlákně: `live` = vektor pózy (`lib/poseMotion`) se živou smyčkou, prolnutý z minulé pózy
 * (obě pózy dál „žijí“ po dobu přechodu, takže smyčka nedá skok). Hodina smyčky `clock` běží jen bez
 * omezeného pohybu; s ním je póza statická. Vrací jen sdílené hodnoty (worklety kreslení smí zachytit jen je).
 */
export function usePoseMotion(poseId: MascotPoseId, reduced: boolean, act?: { code: SharedValue<number>; t: SharedValue<number>; trainMode: number; trainPhase?: SharedValue<number> }) {
  const noCode = useSharedValue(-1);
  const zero = useSharedValue(0);
  // Akce repertoáru (osa t, kód) a cvičení mini opičky (fáze siluety): jen sdílené hodnoty a číslo pro worklet.
  const actCode = act?.code ?? noCode;
  const actT = act?.t ?? zero;
  const trainPhase = act?.trainPhase ?? zero;
  const trainMode = act?.trainMode ?? -1;
  const target = poseVector(MASCOT_POSES[poseId], EYES);
  const from = useSharedValue<number[]>(target);
  const to = useSharedValue<number[]>(target);
  const fromCode = useSharedValue(POSE_CODE[poseId]);
  const toCode = useSharedValue(POSE_CODE[poseId]);
  const t = useSharedValue(1);
  const clock = useSharedValue(0);
  const waveAmp = useSharedValue(0);
  /** Doplňky z teček: náběh 0 → 1 při vstupu do pózy (rozsvícení). Smyčka Zz = `clock`. */
  const extrasIn = useSharedValue(1);
  const prev = useRef(poseId);

  // Hodina živé smyčky: 0 → 1 za LIFE_CLOCK_MS dokola (periody póz ji dělí beze zbytku), UI vlákno.
  // S omezeným pohybem stojí (statická póza).
  useEffect(() => {
    cancelAnimation(clock);
    // Mini opička cvičí ve fázi siluety: živá smyčka stojí, hodina by jen zbytečně překreslovala každý snímek (perf QA d341d87).
    if (reduced || trainMode >= 0) return;
    clock.set(0);
    clock.set(withRepeat(withTiming(1, { duration: LIFE_CLOCK_MS, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(clock);
  }, [reduced, clock, trainMode]);

  useEffect(() => {
    if (prev.current === poseId) return;
    prev.current = poseId;
    const next = poseVector(MASCOT_POSES[poseId], EYES);
    cancelAnimation(t);
    if (reduced) {
      from.set(next); to.set(next); toCode.set(POSE_CODE[poseId]); fromCode.set(POSE_CODE[poseId]); t.set(1); extrasIn.set(1);
      return;
    }
    // Navázat z viditelného stavu (i uprostřed přechodu), ne z minulého cíle.
    const k = bezierOut(t.get());
    from.set(mixVector(from.get(), to.get(), k));
    fromCode.set(k < 0.5 ? fromCode.get() : toCode.get());
    to.set(next);
    toCode.set(POSE_CODE[poseId]);
    t.set(0);
    t.set(withTiming(1, { duration: MP.transitionMs, easing: Easing.linear }));
    extrasIn.set(0);
    extrasIn.set(withTiming(1, { duration: MP.extrasInMs, easing: ease.out }));
  }, [poseId, reduced, from, to, fromCode, toCode, t, extrasIn]);

  // Mávnutí předloktím: `waveCycles` kmitů po vstupu do pózy wave, pak ruka zůstane nahoře a žije s tělem.
  useEffect(() => {
    cancelAnimation(waveAmp);
    if (reduced || poseId !== 'wave') { waveAmp.set(withTiming(0, { duration: MP.cycleOutMs, easing: ease.out })); return; }
    const hold = WAVE_MS * MP.waveCycles - MP.cycleInMs - MP.cycleOutMs;
    waveAmp.set(withSequence(
      withTiming(1, { duration: MP.cycleInMs, easing: ease.out }),
      withDelay(hold, withTiming(0, { duration: MP.cycleOutMs, easing: ease.out })),
    ));
    return () => cancelAnimation(waveAmp);
  }, [poseId, reduced, waveAmp]);

  const on = reduced ? 0 : 1;
  // Mini opička cvičí ve fázi siluety: vlastní smyčka pózy by s ní nebyla v taktu, proto stojí.
  const lifeOn = trainMode >= 0 ? 0 : on;
  const live = useDerivedValue(() => {
    // Prolnutí s křivkou ease.out (cubic-bezier 0.22,1,0.36,1) ve workletu: t běží lineárně.
    const k = bezierOut(t.value);
    const c = clock.value;
    const w = waveAmp.value;
    const mixed = mixVector(applyLife(from.value, fromCode.value, c, lifeOn, w), applyLife(to.value, toCode.value, c, lifeOn, w), k);
    // Nad pózou: fáze cviku (mini opička), pak choreografie akce repertoáru (obálka 0 na začátku i konci osy).
    // Bez akce a cvičení žádné kopie pole navíc (každý snímek každé opice).
    const code = actCode.value;
    const trained = trainMode >= 0 ? applyTrain(mixed, trainMode, trainPhase.value) : mixed;
    return code >= 0 ? applyAct(trained, code, actT.value) : trained;
  });
  return { live, clock, toCode, to, extrasIn, on };
}
