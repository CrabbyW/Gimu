import { useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import Animated, {
  ReduceMotion, cancelAnimation, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { feedback as fb } from '@/lib/feedback';
import { haptics } from '@/lib/haptics';
import { ease, motion, spring, useMotionSafe } from '@/lib/motion';
import { playSfx } from '@/lib/sound';
import type { NodeState } from '@/logic/map';
import { useTheme } from '@/theme';
import { CHECK_LENGTH, CHECK_PATH, PLATE_R, Plate } from './Plate';
import type { PlateKg } from '@/types';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Půlperioda dechu prstence (perioda 2.4 s, motion spec §3.1). */
export const PULSE_MS = motion.breath.periodMs / 2;
const BREATH = motion.breath;
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
}

/** Kulatý uzel mapy: kotouč, u aktuálního prstenec 2 pt `accentGraphic` s mezerou 4 (Teplá litina), jeden stín.
 *  Popisek a opička nejsou děti uzlu (kreslí je LessonMap jako sourozence), takže pulz kotouče je nehýbe. */
export function PlateNode({ kg, size: nodeSize, state, accessibilityLabel, onPress, unlocking = false, onUnlocked, justCompleted = false, checkHidden = false, shakeKey = 0 }: Props) {
  const { size } = useTheme();
  const { reduced } = useMotionSafe();
  const shake = useShake(shakeKey, reduced);
  const feedback = usePressFeedback(0.94);
  const slop = Math.max(0, (size.hitLarge - nodeSize) / 2);
  const solid = state !== 'locked' || unlocking;
  return (
    <Animated.View style={[{ width: nodeSize, height: nodeSize }, shake]}>
      <Animated.View style={feedback.style}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { feedback.onPressIn(); fb(state === 'current' ? 'cta' : state === 'locked' ? 'locked' : 'tapLight'); }}
        onPressOut={feedback.onPressOut}
        hitSlop={slop}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={{ width: nodeSize, height: nodeSize, alignItems: 'center', justifyContent: 'center' }}
      >
        {state === 'current' && !unlocking ? <PulseRing size={nodeSize} reduced={reduced} /> : null}
        {unlocking ? (
          <UnlockingPlate kg={kg} size={nodeSize} reduced={reduced} onUnlocked={onUnlocked} />
        ) : (
          <Shadowed on={solid} size={nodeSize}>
            <Plate kg={kg} size={nodeSize} state={state} check={!(justCompleted || checkHidden)} />
          </Shadowed>
        )}
        {state === 'done' && justCompleted ? <DrawnCheck size={nodeSize} reduced={reduced} /> : null}
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

/** Jediný oddělovač kotouče od mapy: měkký stín dole (bez okraje a pozadí). */
function Shadowed({ on, size, children }: { on: boolean; size: number; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: on ? [{ offsetX: 0, offsetY: 6, blurRadius: 10, color: `${c.shadow}59` }] : undefined }}>
      {children}
    </View>
  );
}

/** Dech aktuálního uzlu (motion spec §3.1): dýchá jen prstenec, opacita 1↔0.6 a scale 1→1.03 z jednoho
 *  shared value, půlperioda 1.2 s ease.sine, nekonečně. Kotouč ani opička se nehýbou. Omezený pohyb: statický 0.8. */
function PulseRing({ size, reduced }: { size: number; reduced: boolean }) {
  const { c, radius, stroke, size: tokens } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) { cancelAnimation(t); t.value = 0; return; }
    t.value = withRepeat(withTiming(1, { duration: PULSE_MS, easing: ease.sine }), -1, true);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  const style = useAnimatedStyle(() => (reduced
    ? { opacity: BREATH.still }
    : { opacity: 1 - t.value * (1 - BREATH.low), transform: [{ scale: 1 + t.value * (BREATH.scale - 1) }] }));
  // Teplá litina §2.7: prstenec 2 pt `accentGraphic` s mezerou 4 pt od hrany kotouče. Žádný glow.
  const ring = size + 2 * (tokens.nodeRingGap + stroke.nodeRing);
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: ring, height: ring, borderRadius: radius.full, borderWidth: stroke.nodeRing, borderColor: c.accentGraphic }, style]}
    />
  );
}

/** Odemčení locked → current (motion spec §3.1), vše na UI vlákně od jednoho startu:
 *  obrys `faint` fade-out 200 ms, litina fade-in 200 ms, Lock fade 120 ms, scale 0.92 → 1 `spring.kotouc`,
 *  trim prstence v `accentGraphic` 400 ms ease.out. Konec trimu = vzor `unlock` (rigid, soft +90) + zvuk
 *  a `onUnlocked`. Omezený pohyb: jen prolnutí 200 ms, prstenec rovnou celý, haptika zůstává. */
function UnlockingPlate({ kg, size, reduced, onUnlocked }: { kg: PlateKg; size: number; reduced: boolean; onUnlocked?(): void }) {
  const { c, size: tokens, stroke } = useTheme();
  const fade = useSharedValue(0);
  const lock = useSharedValue(1);
  const scale = useSharedValue(reduced ? 1 : UNLOCK.from);
  const trim = useSharedValue(reduced ? 1 : 0);
  const land = () => { haptics.unlock(); playSfx('unlock'); onUnlocked?.(); };
  useEffect(() => {
    const never = { reduceMotion: ReduceMotion.Never };
    fade.value = withTiming(1, { ...(reduced ? motion.calmFade : UNLOCK.fade), ...never }, (done) => {
      if (done && reduced) scheduleOnRN(land);
    });
    lock.value = withTiming(0, { duration: UNLOCK.lockMs, easing: ease.out, ...never });
    if (!reduced) {
      scale.value = withSpring(1, spring.kotouc);
      trim.value = withTiming(1, { duration: UNLOCK.trimMs, easing: ease.out }, (done) => { if (done) scheduleOnRN(land); });
    }
    return () => { cancelAnimation(fade); cancelAnimation(lock); cancelAnimation(scale); cancelAnimation(trim); };
    // Odemčení se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const outline = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));
  const lockStyle = useAnimatedStyle(() => ({ opacity: lock.value }));
  const solid = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ scale: scale.value }] }));
  const ring = size + 2 * (tokens.nodeRingGap + stroke.nodeRing);
  const r = (ring - stroke.nodeRing) / 2;
  const circumference = 2 * Math.PI * r;
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: circumference * (1 - trim.value) }));
  const outlineW = (stroke.icon * 100) / size;
  const inset = (size - ring) / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pořadí vrstev podle §2.7: obrys, výplň litiny, prstenec. */}
      <Animated.View style={[{ position: 'absolute' }, outline]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx={50} cy={50} r={PLATE_R} fill="none" stroke={c.faint} strokeWidth={outlineW} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: 'absolute' }, solid]}>
        <Shadowed on size={size}><Plate kg={kg} size={size} state="current" /></Shadowed>
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute', left: inset, top: inset, width: ring, height: ring, transform: [{ rotate: '-90deg' }] }}>
        <Svg width={ring} height={ring}>
          <AnimatedCircle
            cx={ring / 2} cy={ring / 2} r={r} fill="none" stroke={c.accentGraphic} strokeWidth={stroke.nodeRing}
            strokeDasharray={`${circumference} ${circumference}`} animatedProps={ringProps}
          />
        </Svg>
      </View>
      <Animated.View style={lockStyle}><Lock size={tokens.badgeIcon} color={c.muted} strokeWidth={stroke.icon} /></Animated.View>
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
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }} pointerEvents="none">
      <AnimatedPath
        d={CHECK_PATH} stroke={c.text} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
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
