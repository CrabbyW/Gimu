import { View } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation, Easing, useAnimatedProps, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Line } from 'react-native-svg';
import { useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { SilhouetteId } from '@/types';
import { BONES, GROUND_Y, HEAD_R, poseFrame, SILHOUETTES } from './silhouettes';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type P = readonly [number, number];
const STROKE = 4;
const LOOP = { duration: 900, easing: Easing.inOut(Easing.quad) };

function Bone({ a0, a1, b0, b1, t, color }: { a0: P; a1: P; b0: P; b1: P; t: SharedValue<number>; color: string }) {
  const props = useAnimatedProps(() => ({
    x1: a0[0] + (a1[0] - a0[0]) * t.value,
    y1: a0[1] + (a1[1] - a0[1]) * t.value,
    x2: b0[0] + (b1[0] - b0[0]) * t.value,
    y2: b0[1] + (b1[1] - b0[1]) * t.value,
  }));
  return <AnimatedLine animatedProps={props} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />;
}

function Head({ h0, h1, t, color }: { h0: P; h1: P; t: SharedValue<number>; color: string }) {
  const props = useAnimatedProps(() => ({
    cx: h0[0] + (h1[0] - h0[0]) * t.value,
    cy: h0[1] + (h1[1] - h0[1]) * t.value,
  }));
  return <AnimatedCircle animatedProps={props} r={HEAD_R} fill={color} />;
}

/** Postava cviku kmitající mezi dvěma pózami. Při omezeném pohybu stojí v póze A. */
export function ExerciseSilhouette({ id }: { id: SilhouetteId }) {
  const { c, stroke } = useTheme();
  const { reduced } = useMotionSafe();
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    if (!reduced) t.value = withRepeat(withTiming(1, LOOP), -1, true);
    return () => cancelAnimation(t);
  }, [id, reduced, t]);

  const [a, b] = SILHOUETTES[id];
  const vb = poseFrame(id);
  // Zem drží spodní hranu karty; postava se zvětší, aby vyplnila výšku nebo šířku.
  // Dekorativní: Svg na webu atributy přístupnosti propouští do DOM, proto je skrývá obalový View.
  return (
    <View style={{ flex: 1, alignSelf: 'stretch' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Svg width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMax meet">
      <Line x1={vb.x - 200} y1={GROUND_Y + STROKE / 2} x2={vb.x + vb.w + 200} y2={GROUND_Y + STROKE / 2} stroke={c.rule} strokeWidth={stroke.icon} strokeLinecap="round" />
      {BONES.map(([from, to]) => (
        <Bone key={`${from}-${to}`} a0={a.joints[from]} a1={b.joints[from]} b0={a.joints[to]} b1={b.joints[to]} t={t} color={c.text} />
      ))}
      <Head h0={a.head} h1={b.head} t={t} color={c.text} />
    </Svg>
    </View>
  );
}
