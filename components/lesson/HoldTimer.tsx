import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { HoldTimer as HoldTimerState } from './useHoldTimer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 220;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const PULSE_FROM = 3;

/** Kruhový odpočet výdrže: prstenec se vyprazdňuje, uprostřed zbývající sekundy.
 *  Stav a ovládání drží `useHoldTimer` v rodiči, který kreslí i akční lištu. */
export function HoldTimer({ timer }: { timer: HoldTimerState }) {
  const { c, space } = useTheme();
  const { reduced } = useMotionSafe();
  const { progress, secondsLeft, status } = timer;

  const ring = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));

  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced || status !== 'running' || secondsLeft > PULSE_FROM || secondsLeft === 0) return;
    scale.value = withSequence(withTiming(1.06, motion.ui), withTiming(1, motion.ui));
  }, [secondsLeft, status, reduced, scale]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${secondsLeft} ${copy.lesson.seconds.toLowerCase()}`}
      style={{ width: SIZE, height: SIZE, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={c.rule} strokeWidth={STROKE} fill="none" />
        {/* Start nahoře, ubývá po směru hodinových ručiček. */}
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={c.accent} strokeWidth={STROKE} fill="none" strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} animatedProps={ring}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      <Animated.View style={[pulse, { alignItems: 'center' }]}>
        <Stat size="XL" value={secondsLeft} unit={copy.lesson.seconds} />
        {status === 'ready' ? <Text variant="label" tone="muted" style={{ marginTop: space.xs }}>{copy.lesson.holdReady}</Text> : null}
      </Animated.View>
    </View>
  );
}
