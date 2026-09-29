import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion } from '@/lib/motion';
import { useTheme } from '@/theme';

interface Props { total: number; /** 0-based index aktuálního kroku. */ current: number }

const DOT = 8;
const CURRENT_WIDTH = 20;

type DotState = 'done' | 'current' | 'future';

function Dot({ state }: { state: DotState }) {
  const { c, radius } = useTheme();
  const width = useSharedValue(state === 'current' ? CURRENT_WIDTH : DOT);
  useEffect(() => { width.value = withTiming(state === 'current' ? CURRENT_WIDTH : DOT, motion.ui); }, [state, width]);
  const animated = useAnimatedStyle(() => ({ width: width.value }));
  return (
    <Animated.View
      style={[animated, {
        height: DOT,
        borderRadius: radius.full,
        backgroundColor: state === 'done' ? c.text : state === 'current' ? c.accent : 'transparent',
        borderWidth: state === 'future' ? 1 : 0,
        borderColor: c.rule,
      }]}
    />
  );
}

/** Řada teček průběhu: hotové plné, aktuální akcentová pilulka, budoucí obrys. */
export function DotSteps({ total, current }: Props) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} state={i < current ? 'done' : i === current ? 'current' : 'future'} />
      ))}
    </View>
  );
}
