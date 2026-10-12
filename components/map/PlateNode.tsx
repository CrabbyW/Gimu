import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion, cancelAnimation, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSequence, withSpring, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { DotPlate } from '@/components/dots';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { feedback as fb } from '@/lib/feedback';
import { haptics } from '@/lib/haptics';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import { registerPlate } from '@/lib/plateFlight';
import { playSfx } from '@/lib/sound';
import type { NodeState } from '@/logic/map';
import { dots, useTheme } from '@/theme';
import { turnsPerClock, useAmbientClock } from './ambient';
import { usePlateSpin } from './usePlateSpin';
import type { PlateKg } from '@/types';


/** Půlperioda dechu prstence (perioda 2.4 s, motion spec §3.1). */
export const PULSE_MS = motion.breath.periodMs / 2;
const SHAKE = motion.lockedShake;
const UNLOCK = { ...motion.nodeUnlock, fade: { duration: motion.nodeUnlock.fadeMs, easing: ease.out } };

interface Props {
  kg: PlateKg;
  size: number;
  state: NodeState;
  accessibilityLabel: string;
  onPress(): void;
  /** Přehraje odemčení (obrys → litina, Lock, trim prstence, scale); na konci trimu haptika, zvuk a `onUnlocked`. */
  unlocking?: boolean;
  onUnlocked?(): void;
  /** Fajfka se dokreslí (300 ms). */
  justCompleted?: boolean;
  /** Dokončený uzel ještě bez fajfky (výchozí snímek odemykací sekvence). */
  checkHidden?: boolean;
  /** Každá změna čísla uzel zatřese (tap na zamčený). */
  shakeKey?: number;
  /** Natočení teček kotouče v radiánech (motion-agent: ambientní rotace + roztočení prstem, `usePlateSpin`). */
  rotation?: SharedValue<number>;
  /** Úhel komety aktuálního kotouče (motion-agent). */
  comet?: SharedValue<number>;
  /** Nástup tečkového kotouče spirálou po tolika ms (úvodní sled mapy); bez něj stojí hned. */
  intro?: number;
  /** Roztočení prstem pro reakci opičky `spinFollow` (fáze 3): úhel roztočení (rad) se zrcadlí do `spinOut`
   *  na UI vlákně a `onSpinStart` se zavolá při každém novém roztočení. */
  spinOut?: SharedValue<number>;
  onSpinStart?(): void;
  /** Id lekce: kotouč se zaregistruje pro let do lekce (`lib/plateFlight`, změří se při startu). */
  flightId?: string;
}

const TAU = Math.PI * 2;
const TURNS_IDLE = turnsPerClock(motion.plateSpin.idleMs);
const TURNS_CURRENT = turnsPerClock(motion.plateSpin.currentMs);
const TURNS_COMET = turnsPerClock(motion.ambient.cometMs);
const TURNS_BREATH = turnsPerClock(motion.breath.periodMs);
// Dech prstence aktuálního uzlu (Kurogane): pomalejší než záře, ~3.6 s (celé otáčky hodiny → bez skoku při přetočení).
const TURNS_RING = turnsPerClock(motion.outlinePulse.periodMs);
// Kometa startuje ve 12 hodin (stejně jako statický `DotPlate`).
const COMET_HOME = -Math.PI / 2;

/** Kulatý uzel mapy (Nothing Dot): kotouč z teček (`DotPlate`), bez stínu a bez plného prstence.
 *  Popisek a opička nejsou děti uzlu (kreslí je LessonMap jako sourozence), takže pohyb kotouče je nehýbe. */
export function PlateNode({ kg, size: nodeSize, state, accessibilityLabel, onPress, unlocking = false, onUnlocked, justCompleted = false, checkHidden = false, shakeKey = 0, rotation, comet, intro, spinOut, onSpinStart, flightId }: Props) {
  const { size } = useTheme();
  const { reduced } = useMotionSafe();
  // Ambient (spec §3): kotouč se točí 360° / 40 s, aktuální / 24 s; kometa obíhá; záře aktuálního dýchá.
  // Vše odvozené z jedné hodiny mapy (UI vlákno). Roztočení prstem (`usePlateSpin`) se k ambientu přičítá
  // a po doběhu `withDecay` zůstane jen ambient, takže kotouč plynule naváže.
  const clock = useAmbientClock();
  const spinnable = state !== 'locked' && !unlocking;
  const spin = usePlateSpin(spinnable, nodeSize);
  // Worklety smí zachytit jen sdílené hodnoty, ne celý objekt: `spin.gesture` (PanGesture) se na UI vlákno
  // zkopírovat nedá a na nativu to shodí mapu („Cannot copy value of type PanGesture“; web worklety nekopíruje).
  const { spin: spinAngle, spinning: spinOn } = spin;
  useAnimatedReaction(() => spinAngle.value, (v) => { if (spinOut) spinOut.set(v); });
  useAnimatedReaction(() => spinOn.value, (on, was) => { if (on && !was && onSpinStart) scheduleOnRN(onSpinStart); });
  const turns = state === 'current' ? TURNS_CURRENT : TURNS_IDLE;
  const ownRotation = useDerivedValue(() => (clock ? clock.value * TAU * turns : 0) + spinAngle.value);
  const ownComet = useDerivedValue(() => COMET_HOME + (clock ? clock.value * TAU * TURNS_COMET : 0));
  const breath = useDerivedValue(() => {
    if (reduced || !clock) return motion.breath.still;
    // Kosinus od 1 (plná záře) k `low` a zpět, perioda `breath.periodMs`.
    const b = motion.breath;
    return b.low + (1 - b.low) * (0.5 + 0.5 * Math.cos(clock.value * TAU * TURNS_BREATH));
  });
  // Dech obrysu aktuálního uzlu (U5): stejná hodina a fáze jako záře, amplituda `outlinePulse`. Po zobrazení
  // (mount nebo konec odemčení) začne na vrcholu a do dechu se prolne za `blendMs`: plný obrys hned, bez skoku.
  const pulseOn = state === 'current' && !unlocking && !reduced && clock !== null;
  const blend = useSharedValue(0);
  useEffect(() => {
    if (!pulseOn) return;
    blend.value = 0;
    blend.value = withTiming(1, { duration: motion.outlinePulse.blendMs, easing: ease.sine, reduceMotion: ReduceMotion.Never });
  }, [pulseOn, blend]);
  const OUT_LOW = motion.outlinePulse.low;
  const outline = useDerivedValue(() => {
    if (!clock) return 1;
    const k = OUT_LOW + (1 - OUT_LOW) * (0.5 + 0.5 * Math.cos(clock.value * TAU * TURNS_RING));
    return 1 - blend.value * (1 - k);
  });
  const shake = useShake(shakeKey, reduced);
  const feedback = usePressFeedback(0.94);
  const slop = Math.max(0, (size.hitLarge - nodeSize) / 2);
  const box = useRef<Animated.View>(null);
  useEffect(() => (flightId ? registerPlate(flightId, box.current, kg, state) : undefined), [flightId, kg, state]);
  return (
    <Animated.View ref={box} style={[{ width: nodeSize, height: nodeSize }, shake]}>
      <GestureDetector gesture={spin.gesture}>
      <Animated.View style={feedback.style}>
      <Pressable
        // Po roztočení prstem tap neotevírá popover (puštění po švihu není klepnutí).
        onPress={() => { if (!spin.dragged.value) onPress(); }}
        onPressIn={() => { feedback.onPressIn(); fb(state === 'current' ? 'cta' : state === 'locked' ? 'locked' : 'tapLight'); }}
        onPressOut={feedback.onPressOut}
        hitSlop={slop}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{ width: nodeSize, height: nodeSize, alignItems: 'center', justifyContent: 'center' }}
      >
        {unlocking ? (
          <UnlockingPlate kg={kg} size={nodeSize} reduced={reduced} onUnlocked={onUnlocked} rotation={rotation ?? ownRotation} />
        ) : state === 'done' && justCompleted ? (
          // Nacvaknutí: prstenec aktuálního uzlu se stáhne a střed se rozvine do plného disku s otvorem.
          <SnapToDone kg={kg} size={nodeSize} reduced={reduced} rotation={rotation ?? ownRotation} />
        ) : state === 'done' && checkHidden ? (
          // Výchozí snímek sekvence: právě dokončený uzel ještě vypadá jako aktuální (prstenec + živý střed, bez dechu).
          <DotPlate variant="node" kg={kg} size={nodeSize} state="current" decorative rotation={rotation ?? ownRotation} />
        ) : (
          // Nothing Dot: kotouč z teček, bez stínu. Aktuální uzel nese záře a kometa (místo plného prstence),
          // `rotation`/`comet` napojí motion-agent (ambientní rotace, roztočení).
          <DotPlate
            variant="node" kg={kg} size={nodeSize} state={state} check={!(justCompleted || checkHidden)} decorative
            rotation={rotation ?? ownRotation} comet={comet ?? ownComet} breath={state === 'current' ? breath : undefined} outline={pulseOn ? outline : undefined}
            touch={spinnable ? spin.touch : undefined} intro={intro ?? false}
          />
        )}
      </Pressable>
      </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/** Odemčení locked → current (Kurogane, motion-agent): prstenec „se přesune“ na nový uzel. Slabý obrys
 *  zamčeného uzlu (14 teček) se prolne pryč (`fadeMs`), prstenec 24 teček s živým středem vyroste z poloměru
 *  obrysu (`lockedR / ringR`) na plný za `trimMs` (`ease.punch`, timing bez pružiny: uzel je klikatelný).
 *  Konec = vzor `unlock` (haptika + zvuk) a `onUnlocked`. Omezený pohyb: jen prolnutí 200 ms, haptika zůstává.
 *  Na UI vlákně od jednoho startu. */
function UnlockingPlate({ kg, size, reduced, onUnlocked, rotation }: { kg: PlateKg; size: number; reduced: boolean; onUnlocked?(): void; rotation?: SharedValue<number> }) {
  const fade = useSharedValue(0);
  const grow = useSharedValue(reduced ? 1 : 0);
  const land = () => { haptics.unlock(); playSfx('unlock'); onUnlocked?.(); };
  useEffect(() => {
    const never = { reduceMotion: ReduceMotion.Never };
    fade.value = withTiming(1, { ...(reduced ? motion.calmFade : UNLOCK.fade), ...never }, (done) => {
      if (done && reduced) scheduleOnRN(land);
    });
    if (!reduced) {
      grow.value = withTiming(1, { duration: UNLOCK.trimMs, easing: ease.punch }, (done) => { if (done) scheduleOnRN(land); });
    }
    return () => { cancelAnimation(fade); cancelAnimation(grow); };
    // Odemčení se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const FROM = UNLOCK_FROM;
  const outline = useAnimatedStyle(() => ({ opacity: 1 - fade.value, transform: [{ scale: 1 + (1 / FROM - 1) * grow.value }] }));
  const solid = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: FROM + (1 - FROM) * grow.value }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Obrys zamčeného uzlu roste s prstencem (stejný poloměr v každém snímku) a mizí. */}
      <Animated.View style={[{ position: 'absolute' }, outline]}>
        <DotPlate variant="node" kg={kg} size={size} state="locked" decorative />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, solid]}>
        {/* Stejné natočení jako ambient po odemčení: výměna za běžný kotouč nedá skok. */}
        <DotPlate variant="node" kg={kg} size={size} state="current" decorative rotation={rotation} />
      </Animated.View>
    </View>
  );
}

/** Prstenec roste z poloměru zamčeného obrysu. */
const UNLOCK_FROM = dots.node.lockedR / dots.node.ringR;

/** Nacvaknutí dokončeného uzlu (Kurogane, motion-agent): prstenec aktuálního uzlu se stáhne k disku a zhasne
 *  (`snapMs` × 0.8, `ease.exit`), plný disk s otvorem vyroste ze živého středu (`liveCore / doneDisc` → 1,
 *  `snapMs`, `ease.punch`, bez pružiny). Dosednutí = `seriesPlate` (rigid + tick). Omezený pohyb: prolnutí. */
function SnapToDone({ kg, size, reduced, rotation }: { kg: PlateKg; size: number; reduced: boolean; rotation?: SharedValue<number> }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const cfg = reduced
      ? { ...motion.calmFade, reduceMotion: ReduceMotion.Never }
      : { duration: SNAP.ms, easing: ease.punch };
    p.value = withTiming(1, cfg, (done) => { if (done) scheduleOnRN(fb, 'seriesPlate'); });
    return () => cancelAnimation(p);
    // Nacvaknutí se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const FROM = SNAP.from, SHRINK = SNAP.shrink, still = reduced ? 1 : 0;
  const ring = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - p.value * 1.25),
    transform: [{ scale: 1 - (1 - SHRINK) * p.value * (1 - still) }],
  }));
  const disc = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 2),
    transform: [{ scale: FROM + (1 - FROM) * (still ? 1 : p.value) }],
  }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute' }, ring]}>
        <DotPlate variant="node" kg={kg} size={size} state="current" decorative rotation={rotation} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, disc]}>
        <DotPlate variant="node" kg={kg} size={size} state="done" decorative />
      </Animated.View>
    </View>
  );
}

const SNAP = { ms: motion.checkMs, from: dots.node.liveCore / dots.node.doneDisc, shrink: dots.node.doneDisc / (2 * dots.node.ringR) };

/** Průběh odemčení 0 → 1: pružina `motion.unlock` (s omezeným pohybem 200ms fade).
 *  Dopad = první dosažení cíle (pružina pak ještě doznívá): haptika a `onUnlocked`. */
export function useUnlockProgress(reduced: boolean, onUnlocked?: () => void) {
  const p = useSharedValue(0);
  const land = () => { haptics.unlock(); playSfx('unlock'); onUnlocked?.(); };
  useAnimatedReaction(
    () => p.value >= 1,
    (arrived, before) => { if (arrived && !before) scheduleOnRN(land); },
  );
  useEffect(() => {
    p.value = reduced ? withTiming(1, { ...motion.calmFade, reduceMotion: ReduceMotion.Never }) : withSpring(1, motion.unlock);
    return () => cancelAnimation(p);
    // Odemčení se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return p;
}

/** Tap na zamčený uzel (motion spec §3.1): translateX 0 → 3 → −3 → 3 → 0, 4 × 60 ms Cvak (dvakrát tam a zpět,
 *  240 ms). Omezený pohyb: opacita 1 → 0.5 → 1 za 240 ms. Warning hraje `feedback('locked')` na onPressIn. */
export function useShake(key: number, reduced: boolean) {
  const x = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    if (key === 0) return;
    const never = { reduceMotion: ReduceMotion.Never };
    if (reduced) {
      const half = { duration: SHAKE.ms, easing: ease.out, ...never };
      o.value = withSequence(withTiming(SHAKE.dim, half), withTiming(1, half));
      return;
    }
    const d = { duration: SHAKE.stepMs, easing: ease.out };
    x.value = withSequence(withTiming(SHAKE.px, d), withTiming(-SHAKE.px, d), withTiming(SHAKE.px, d), withTiming(0, d));
  }, [key, reduced, x, o]);
  return useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateX: x.value }] }));
}
