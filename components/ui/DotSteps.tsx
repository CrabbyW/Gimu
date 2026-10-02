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
        backgroundColor: state === 'done' ? c.text : state === 'current' ? c.text : 'transparent',
        borderWidth: state === 'future' ? 1 : 0,
        borderColor: c.rule,
      }]}
    />
  );
}

/** Řada teček průběhu: hotové plné tečky, aktuální plná pilulka (stav nese tvar, ne barva), budoucí obrys.
 *  Bez akcentu (R42: ember jen v oslavě dokončení lekce). */
export function DotSteps({ total, current }: Props) {
  const { space } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: current + 1 }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: space.s }}
    >
      {Array.from({ length: total }, (_, i) => (
        <Dot key={i} state={i < current ? 'done' : i === current ? 'current' : 'future'} />
      ))}
    </View>
  );
}
