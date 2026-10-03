import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect, Text as SvgText } from 'react-native-svg';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { copy } from '@/data/copy';
import { feedback as fb } from '@/lib/feedback';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import type { NodeState } from '@/logic/map';
import { svgType, useTheme } from '@/theme';
import { BOSS_SIZE } from './geometry';
import { PULSE_MS, useShake, useUnlockProgress } from './PlateNode';

const W = BOSS_SIZE.w;
const H = BOSS_SIZE.h;
const MID = H / 2;
// Kotouče od objímky ven: nejtěžší (nejvyšší) u středu.
const PLATES = [{ h: 80, kg: 25 }, { h: 70, kg: 20 }, { h: 60, kg: 15 }, { h: 50, kg: 10 }] as const;
const PW = 12;
const GAP = 2;
const COLLAR_X = 50; // vnitřní hrana prvního kotouče od středu osy; objímka sedí těsně před ní
const PULSE_PAD = 8;

interface Props {
  state: NodeState;
  accessibilityLabel: string;
  onPress(): void;
  shakeKey?: number;
  /** Stejné odemčení jako u kotouče: obrys → plná osa na pružině, haptika, `onUnlocked`. */
  unlocking?: boolean;
  onUnlocked?(): void;
}

/** Boss: plně naložená osa zepředu. Zamčená je jen obrys v `rule`. */
export function BarbellBoss({ state, accessibilityLabel, onPress, shakeKey = 0, unlocking = false, onUnlocked }: Props) {
  const { reduced } = useMotionSafe();
  const shake = useShake(shakeKey, reduced);
  const feedback = usePressFeedback(0.96);
  return (
    <Animated.View style={[{ width: W, height: H, alignItems: 'center', justifyContent: 'center' }, shake]}>
      {state === 'current' && !unlocking ? <BossPulse reduced={reduced} /> : null}
      <Animated.View style={feedback.style}>
        <Pressable onPress={onPress} onPressIn={() => { feedback.onPressIn(); fb(state === 'current' ? 'cta' : state === 'locked' ? 'locked' : 'tapLight'); }} onPressOut={feedback.onPressOut} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          {unlocking ? <UnlockingBarbell reduced={reduced} onUnlocked={onUnlocked} /> : <Barbell state={state} />}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function Barbell({ state }: { state: NodeState }) {
  const { c, seasonal, stroke: tokens } = useTheme();
  const locked = state === 'locked';
  // Zamčená osa je obrys; výplň podkladem mapy zakryje tyč za kotouči, aby se čáry nekřížily.
  // Teplá litina §2.7: zamčený boss v obrysu `faint` (grafika ≥ 3:1 na base), ne `rule`.
  const stroke = locked ? { fill: seasonal.mapBase, stroke: c.faint, strokeWidth: tokens.icon } : null;
  const side = (dir: -1 | 1) => PLATES.map((p, i) => {
    const inner = W / 2 + dir * (COLLAR_X + i * (PW + GAP));
    const px = dir === 1 ? inner : inner - PW;
    return (
      <Rect key={`${dir}-${p.kg}`} x={px} y={MID - p.h / 2} width={PW} height={p.h} rx={3}
        {...(stroke ?? { fill: c[`plate${p.kg}`] })} />
    );
  });
  const collar = (dir: -1 | 1) => (
    <Rect x={dir === 1 ? W / 2 + COLLAR_X - 8 : W / 2 - COLLAR_X} y={MID - 9} width={8} height={18} rx={2} {...(stroke ?? { fill: c.muted })} />
  );
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={MID - 3} width={W} height={6} rx={3} {...(stroke ?? { fill: c.plateRim })} />
      {collar(-1)}{collar(1)}
      {side(-1)}{side(1)}
      <SvgText x={W / 2} y={MID - 10} fontFamily={svgType.label.fontFamily} fontSize={svgType.label.fontSize} letterSpacing={svgType.label.letterSpacing} textAnchor="middle" fill={locked ? c.muted : c.text}>
        {copy.map.boss}
      </SvgText>
      {state === 'done' ? (
        <Path d={`M${W / 2 - 7} ${MID + 16} l5 5 l10 -11`} stroke={c.text} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </Svg>
  );
}

function UnlockingBarbell({ reduced, onUnlocked }: { reduced: boolean; onUnlocked?(): void }) {
  const p = useUnlockProgress(reduced, onUnlocked);
  const outline = useAnimatedStyle(() => ({ opacity: 1 - Math.min(p.value, 1) }));
  const solid = useAnimatedStyle(() => ({ opacity: Math.min(p.value, 1), transform: [{ scale: reduced ? 1 : motion.bossUnlock.from + (1 - motion.bossUnlock.from) * p.value }] }));
  return (
    <View style={{ width: W, height: H }}>
      <Animated.View style={[{ position: 'absolute' }, outline]}><Barbell state="locked" /></Animated.View>
      <Animated.View style={[{ position: 'absolute' }, solid]}><Barbell state="current" /></Animated.View>
    </View>
  );
}
function BossPulse({ reduced }: { reduced: boolean }) {
  const { c, radius, stroke } = useTheme();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduced) { cancelAnimation(t); t.value = 0; return; }
    t.value = withRepeat(withTiming(1, { duration: PULSE_MS, easing: ease.sine }), -1, true);
    return () => cancelAnimation(t);
  }, [reduced, t]);
  // Stejný dech jako prstenec uzlu (§3.1): `motion.breath`.
  const b = motion.breath;
  const style = useAnimatedStyle(() => (reduced ? { opacity: b.still } : { opacity: 1 - t.value * (1 - b.low), transform: [{ scale: 1 + t.value * (b.scale - 1) }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: W + PULSE_PAD * 2, height: H + PULSE_PAD * 2, borderRadius: radius.l, borderWidth: stroke.nodeRing, borderColor: c.accentGraphic }, style]}
    />
  );
}
