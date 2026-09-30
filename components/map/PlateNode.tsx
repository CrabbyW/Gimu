import { useEffect, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  cancelAnimation, useAnimatedProps, useAnimatedReaction, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';
import { haptics } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';
import type { NodeState } from '@/logic/map';
import { useTheme } from '@/theme';
import { CHECK_LENGTH, CHECK_PATH, Plate } from './Plate';
import type { PlateKg } from '@/types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const PULSE_MS = 1100;
const RING_GAP = 14;
const CHECK_MS = 280;
const SHAKE = 6;

interface Props {
  kg: PlateKg;
  size: number;
  state: NodeState;
  accessibilityLabel: string;
  onPress(): void;
  /** Přehraje odemčení: obrys → plný kotouč (pružina), po dopadu haptika a `onUnlocked`. */
  unlocking?: boolean;
  onUnlocked?(): void;
  /** Fajfka se dokreslí (280 ms). */
  justCompleted?: boolean;
  /** Dokončený uzel ještě bez fajfky (výchozí snímek odemykací sekvence). */
  checkHidden?: boolean;
  /** Každá změna čísla uzel zatřese (tap na zamčený). */
  shakeKey?: number;
}

/** Kulatý uzel mapy: kotouč, u aktuálního pulzující akcentový prstenec, jeden měkký stín. */
export function PlateNode({ kg, size: nodeSize, state, accessibilityLabel, onPress, unlocking = false, onUnlocked, justCompleted = false, checkHidden = false, shakeKey = 0 }: Props) {
  const { size } = useTheme();
  const { reduced } = useMotionSafe();
  const shake = useShake(shakeKey, reduced);
  const slop = Math.max(0, (size.hitLarge - nodeSize) / 2);
  const solid = state !== 'locked' || unlocking;
  return (
    <Animated.View style={[{ width: nodeSize, height: nodeSize }, shake]}>
      <Pressable
        onPress={onPress}
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
  );
}

/** Jediný oddělovač kotouče od mapy: měkký stín dole (bez okraje a pozadí). */
function Shadowed({ on, size, children }: { on: boolean; size: number; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: on ? [{ offsetX: 0, offsetY: 6, blurRadius: 10, color: `${c.onAccent}59` }] : undefined }}>
      {children}
    </View>
  );
}

function PulseRing({ size, reduced }: { size: number; reduced: boolean }) {
  const { c, radius } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) { cancelAnimation(t); t.value = 0; return; }
    t.value = withRepeat(withTiming(1, { duration: PULSE_MS }), -1, true);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - t.value * 0.6, transform: [{ scale: 1 + t.value * 0.08 }] }));
  const ring = size + RING_GAP;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: ring, height: ring, borderRadius: radius.full, borderWidth: 2, borderColor: c.accent }, style]}
    />
  );
}

/** Crossfade obrysu do plného kotouče + scale 0.8 → 1 na pružině; po dopadu haptika. */
function UnlockingPlate({ kg, size, reduced, onUnlocked }: { kg: PlateKg; size: number; reduced: boolean; onUnlocked?(): void }) {
  const p = useUnlockProgress(reduced, onUnlocked);
  const outline = useAnimatedStyle(() => ({ opacity: 1 - Math.min(p.value, 1) }));
  const solid = useAnimatedStyle(() => ({ opacity: Math.min(p.value, 1), transform: [{ scale: reduced ? 1 : 0.8 + 0.2 * p.value }] }));
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute' }, outline]}><Plate kg={kg} size={size} state="locked" /></Animated.View>
      <Animated.View style={[{ position: 'absolute' }, solid]}>
        <Shadowed on size={size}><Plate kg={kg} size={size} state="current" /></Shadowed>
      </Animated.View>
    </View>
  );
}

function DrawnCheck({ size, reduced }: { size: number; reduced: boolean }) {
  const { c } = useTheme();
  const offset = useSharedValue(reduced ? 0 : CHECK_LENGTH);
  useEffect(() => {
    if (!reduced) offset.value = withTiming(0, { duration: CHECK_MS, easing: motion.ui.easing });
  }, [offset, reduced]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: offset.value }));
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }} pointerEvents="none">
      <AnimatedPath
        d={CHECK_PATH} stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={`${CHECK_LENGTH} ${CHECK_LENGTH}`} animatedProps={props}
      />
    </Svg>
  );
}

/** Průběh odemčení 0 → 1: pružina `motion.unlock` (s omezeným pohybem 200ms fade).
 *  Dopad = první dosažení cíle (pružina pak ještě doznívá): haptika a `onUnlocked`. */
export function useUnlockProgress(reduced: boolean, onUnlocked?: () => void) {
  const p = useSharedValue(0);
  const land = () => { haptics.unlock(); onUnlocked?.(); };
  useAnimatedReaction(
    () => p.value >= 1,
    (arrived, before) => { if (arrived && !before) scheduleOnRN(land); },
  );
  useEffect(() => {
    p.value = reduced ? withTiming(1, { duration: 200 }) : withSpring(1, motion.unlock);
    return () => cancelAnimation(p);
    // Odemčení se přehraje jednou při mountu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return p;
}

/** ±6 px zatřesení v timingu (UI zpětná vazba, ne odměna). */
export function useShake(key: number, reduced: boolean) {
  const x = useSharedValue(0);
  useEffect(() => {
    if (key === 0 || reduced) return;
    const d = { duration: 50 };
    x.value = withSequence(withTiming(-SHAKE, d), withTiming(SHAKE, d), withTiming(-SHAKE, d), withTiming(SHAKE, d), withTiming(0, d));
  }, [key, reduced, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}
