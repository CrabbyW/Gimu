import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { copy } from '@/data/copy';
import { feedback as fb } from '@/lib/feedback';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import type { NodeState } from '@/logic/map';
import { dots, svgType, useTheme } from '@/theme';
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
const DOT_PITCH = dots.boss.pitch;

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

/** Tečky obdélníku (kotouč, objímka): sloupce × řádky po `DOT_PITCH`, vystředěné v obdélníku. */
function rectDots(x: number, y: number, w: number, h: number) {
  const cols = Math.max(1, Math.floor(w / DOT_PITCH));
  const rows = Math.max(1, Math.floor(h / DOT_PITCH));
  const ox = x + (w - (cols - 1) * DOT_PITCH) / 2;
  const oy = y + (h - (rows - 1) * DOT_PITCH) / 2;
  const out: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) out.push({ x: ox + k * DOT_PITCH, y: oy + r * DOT_PITCH });
  return out;
}

/** Boss jako tečková činka (Nothing Dot): osa = řada teček, kotouče a objímky = tečkové sloupce. Zamčená
 *  v `dotDim`, odemčená v `text` (nejtěžší kotouče u středu jsou nejvyšší, hmotnost nese výška, ne odstín). */
function Barbell({ state }: { state: NodeState }) {
  const { c, stroke: tokens } = useTheme();
  const locked = state === 'locked';
  const ink = locked ? c.dotDim : c.text;
  const rects: { x: number; y: number; w: number; h: number }[] = [];
  for (const dir of [-1, 1] as const) {
    PLATES.forEach((p, i) => {
      const inner = W / 2 + dir * (COLLAR_X + i * (PW + GAP));
      rects.push({ x: dir === 1 ? inner : inner - PW, y: MID - p.h / 2, w: PW, h: p.h });
    });
    rects.push({ x: dir === 1 ? W / 2 + COLLAR_X - 8 : W / 2 - COLLAR_X, y: MID - 9, w: 8, h: 18 });
  }
  const pts = rects.flatMap((r) => rectDots(r.x, r.y, r.w, r.h));
  // Osa: jedna řada teček, jen mimo kotouče a objímky (jinak by se tečky zdvojily).
  for (let x = DOT_PITCH / 2; x < W; x += DOT_PITCH) {
    if (!rects.some((r) => x >= r.x - DOT_PITCH / 2 && x <= r.x + r.w + DOT_PITCH / 2)) pts.push({ x, y: MID });
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {pts.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={dots.path.r} fill={ink} />)}
      <SvgText x={W / 2} y={MID - 10} fontFamily={svgType.label.fontFamily} fontSize={svgType.label.fontSize} letterSpacing={svgType.label.letterSpacing} textAnchor="middle" fill={locked ? c.muted : c.text}>
        {copy.map.boss}
      </SvgText>
      {state === 'done' ? (
        <Path d={`M${W / 2 - 7} ${MID + 16} l5 5 l10 -11`} stroke={c.text} strokeWidth={tokens.check} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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
