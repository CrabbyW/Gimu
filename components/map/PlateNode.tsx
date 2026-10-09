import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion, cancelAnimation, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSequence, withSpring, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { DotPlate } from '@/components/dots';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { feedback as fb } from '@/lib/feedback';
import { haptics } from '@/lib/haptics';
import { ease, motion, spring, useMotionSafe } from '@/lib/motion';
import { registerPlate } from '@/lib/plateFlight';
import { playSfx } from '@/lib/sound';
import type { NodeState } from '@/logic/map';
import { useTheme } from '@/theme';
import { turnsPerClock, useAmbientClock } from './ambient';
import { usePlateSpin } from './usePlateSpin';
import type { PlateKg } from '@/types';

/** Fajfka dokončeného uzlu přes středový otvor kotouče, ve viewBoxu 100×100. Délka tahu ≈ 18. */
const CHECK_PATH = 'M44 50 l4 4 l8 -9';
const CHECK_LENGTH = 18;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Půlperioda dechu prstence (perioda 2.4 s, motion spec §3.1). */
export const PULSE_MS = motion.breath.periodMs / 2;
const CHECK_MS = motion.checkMs;
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
        ) : (
          // Nothing Dot: kotouč z teček, bez stínu. Aktuální uzel nese záře a kometa (místo plného prstence),
          // `rotation`/`comet` napojí motion-agent (ambientní rotace, roztočení).
          <DotPlate
            kg={kg} size={nodeSize} state={state} check={!(justCompleted || checkHidden)} decorative
            rotation={rotation ?? ownRotation} comet={comet ?? ownComet} breath={state === 'current' ? breath : undefined}
            touch={spinnable ? spin.touch : undefined} intro={intro ?? false}
          />
        )}
        {state === 'done' && justCompleted ? <DrawnCheck size={nodeSize} reduced={reduced} /> : null}
      </Pressable>
      </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/** Odemčení locked → current (motion spec §3.1), vše na UI vlákně od jednoho startu:
 *  zamčený kotouč (jen vnější prstenec `dotDim` se zámkem) fade-out 200 ms, plný tečkový kotouč fade-in 200 ms,
 *  scale 0.92 → 1 `spring.kotouc`, trim prstence v `text` 400 ms ease.out. Konec trimu = vzor `unlock` + zvuk
 *  a `onUnlocked`. Omezený pohyb: jen prolnutí 200 ms, prstenec rovnou celý, haptika zůstává.
 *  Nothing Dot: vizuál vrstev vyměněn za `DotPlate`, časování beze změny (motion-agent ho může přeladit). */
function UnlockingPlate({ kg, size, reduced, onUnlocked, rotation }: { kg: PlateKg; size: number; reduced: boolean; onUnlocked?(): void; rotation?: SharedValue<number> }) {
  const { c, size: tokens, stroke } = useTheme();
  const fade = useSharedValue(0);
  const scale = useSharedValue(reduced ? 1 : UNLOCK.from);
  const trim = useSharedValue(reduced ? 1 : 0);
  const land = () => { haptics.unlock(); playSfx('unlock'); onUnlocked?.(); };
  useEffect(() => {
    const never = { reduceMotion: ReduceMotion.Never };
    fade.value = withTiming(1, { ...(reduced ? motion.calmFade : UNLOCK.fade), ...never }, (done) => {
      if (done && reduced) scheduleOnRN(land);
    });
    if (!reduced) {
      scale.value = withSpring(1, spring.kotouc);
      trim.value = withTiming(1, { duration: UNLOCK.trimMs, easing: ease.out }, (done) => { if (done) scheduleOnRN(land); });
    }
    return () => { cancelAnimation(fade); cancelAnimation(scale); cancelAnimation(trim); };
    // Odemčení se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const outline = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));
  const solid = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: scale.value }] }));
  const ring = size + 2 * (tokens.nodeRingGap + stroke.hairline);
  const r = (ring - stroke.hairline) / 2;
  const circumference = 2 * Math.PI * r;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - trim.value) }));
  const inset = (size - ring) / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Vrstvy: zamčený (vnější prstenec + zámek) → plný tečkový kotouč → vlasový prstenec „nabíjení“ (zmizí s koncem sekvence). */}
      <Animated.View style={[{ position: 'absolute' }, outline]}>
        <DotPlate kg={kg} size={size} state="locked" decorative />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, solid]}>
        {/* Stejné natočení jako ambient po odemčení: výměna za běžný kotouč nedá skok. */}
        <DotPlate kg={kg} size={size} state="current" decorative rotation={rotation} />
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute', left: inset, top: inset, width: ring, height: ring, transform: [{ rotate: '-90deg' }] }}>
        <Svg aria-hidden width={ring} height={ring}>
          <AnimatedCircle
            cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke={c.text} strokeWidth={stroke.hairline}
            strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps}
          />
        </Svg>
      </View>
    </View>
  );
}

function DrawnCheck({ size, reduced }: { size: number; reduced: boolean }) {
  const { c } = useTheme();
  const offset = useSharedValue(reduced ? 0 : CHECK_LENGTH);
  useEffect(() => {
    if (!reduced) offset.value = withTiming(0, { duration: CHECK_MS, easing: ease.out });
  }, [offset, reduced]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <Svg aria-hidden width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }} pointerEvents="none">
      <AnimatedPath
        d={CHECK_PATH} stroke={c.onText} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`} animatedProps={props}
      />
    </Svg>
  );
}

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
