import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, useAnimatedProps, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Stat } from '@/components/ui/Stat';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, intro, motion, useMotionSafe } from '@/lib/motion';
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
  const { progress, secondsLeft, status, countdown } = timer;

  const ring = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));

  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced || status !== 'running' || secondsLeft > PULSE_FROM || secondsLeft === 0) return;
    scale.set(withSequence(withTiming(1.06, motion.press), withTiming(1, motion.release)));
  }, [secondsLeft, status, reduced, scale]);
  // Start výdrže (motion): měřidlo se nadechne (0.97, press 90 ms) a rozhodně vrátí (release 220 ms punch),
  // potvrzení, že výdrž běží. Jen po odpočtu 3-2-1, ne při pokračování po pauze.
  const prev = useRef(status);
  useEffect(() => {
    const from = prev.current;
    prev.current = status;
    if (reduced || from !== 'countdown' || status !== 'running') return;
    scale.set(withSequence(withTiming(intro.holdStart.dip, motion.press), withTiming(1, motion.release)));
  }, [status, reduced, scale]);
  // Konec výdrže (UX2): číslo i prstenec jednou tvrdě „dosednou“ spolu s haptikou Medium (1 → 1.1 → 1).
  useEffect(() => {
    if (reduced || status !== 'done') return;
    scale.set(withSequence(withTiming(1.1, { duration: 90, easing: ease.punch }), withTiming(1, motion.release)));
  }, [status, reduced, scale]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Odpočet 3-2-1 (motion spec §2): každé číslo nastoupí scale 1.2 → 1 pružinou `slam` (ζ ≈ 0.8),
  // ve stejném ticku jako haptika z useHoldTimer. Reduce motion: prolnutí 200 ms bez měřítka.
  const cdScale = useSharedValue(1);
  const cdOpacity = useSharedValue(1);
  useEffect(() => {
    if (status !== 'countdown' || countdown === 0) return;
    if (reduced) {
      cdOpacity.set(0);
      cdOpacity.set(withTiming(1, motion.calmFade));
    } else {
      cdScale.set(1.2);
      cdScale.set(withSpring(1, motion.slam));
    }
  }, [countdown, status, reduced, cdScale, cdOpacity]);
  const cdStyle = useAnimatedStyle(() => ({ opacity: cdOpacity.value, transform: [{ scale: cdScale.value }] }));
  const counting = status === 'countdown' && countdown > 0;

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
        {counting ? (
          <Animated.View style={cdStyle}>
            <Stat size="L" value={countdown} unit="" />
          </Animated.View>
        ) : (
          <Stat size="L" value={secondsLeft} unit={copy.lesson.seconds} />
        )}
        {status === 'ready' ? (
          <Animated.View exiting={FadeOut.duration(motion.uiExit.duration).easing(motion.uiExit.easing)}>
            <Text variant="label" tone="muted" style={{ marginTop: space.xs }}>{copy.lesson.holdReady}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
}
