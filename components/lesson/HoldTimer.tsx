import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import { stroke, useTheme } from '@/theme';
import type { HoldTimer as HoldTimerState } from './useHoldTimer';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 220;
const STROKE = stroke.ring;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const PULSE_FROM = 3;

/** Kruhový odpočet výdrže: prstenec v `text` na stopě `rule` se vyprazdňuje, uprostřed zbývající sekundy.
 *  R42: bez akcentu, měřidlo nese kontrast; useknutý konec (butt) čte jako měřicí čára, ne jako pilulka.
 *  Stav a ovládání drží `useHoldTimer` v rodiči, který kreslí i akční lištu. */
export function HoldTimer({ timer }: { timer: HoldTimerState }) {
  const { c, space } = useTheme();
  const { reduced } = useMotionSafe();
  const { progress, secondsLeft, status } = timer;

  const ring = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));

  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced || status !== 'running' || secondsLeft > PULSE_FROM || secondsLeft === 0) return;
    scale.set(withSequence(withTiming(1.06, motion.press), withTiming(1, motion.release)));
  }, [secondsLeft, status, reduced, scale]);
  // Konec výdrže (UX2): číslo i prstenec jednou tvrdě „dosednou“ spolu s haptikou Medium (1 → 1.1 → 1).
  useEffect(() => {
    if (reduced || status !== 'done') return;
    scale.set(withSequence(withTiming(1.1, { duration: 90, easing: ease.punch }), withTiming(1, motion.release)));
  }, [status, reduced, scale]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${secondsLeft} ${copy.lesson.seconds.toLowerCase()}`}
      style={{ width: SIZE, height: SIZE, alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[pulse, { position: 'absolute' }]}>
      <Svg width={SIZE} height={SIZE}>
        <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={c.rule} strokeWidth={STROKE} fill="none" />
        {/* Start nahoře, ubývá po směru hodinových ručiček. */}
        <AnimatedCircle
          cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={c.text} strokeWidth={STROKE} fill="none" strokeLinecap="butt"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`} animatedProps={ring}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </Svg>
      </Animated.View>
      <Animated.View style={[pulse, { alignItems: 'center' }]}>
        <Stat size="L" value={secondsLeft} unit={copy.lesson.seconds} />
        {status === 'ready' ? <Text variant="label" tone="muted" style={{ marginTop: space.xs }}>{copy.lesson.holdReady}</Text> : null}
      </Animated.View>
    </View>
  );
}
