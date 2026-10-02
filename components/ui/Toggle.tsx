import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import { opacity, useTheme } from '@/theme';

interface Props {
  value: boolean;
  onChange(next: boolean): void;
  /** Hlasitý popis (např. „Denní připomínka“). */
  label: string;
  disabled?: boolean;
}

/** Přepínač 52×32 v ploše min. 44 pt (Task 29, R42). Vypnutý: stopa `rule`, knoflík `muted`.
 *  Zapnutý: stopa `text`, knoflík `base` — stav nese kontrast a poloha knoflíku, ne akcent.
 *  Pohyb: knoflík přejede a barvy se prolnou za 180 ms (timing, bez pružiny: na ovládání se klepe).
 *  Omezený pohyb: změna hned. Stav (`value`) se mění okamžitě, animace ho jen znázorňuje. */
export function Toggle({ value, onChange, label, disabled = false }: Props) {
  const { c, size, radius } = useTheme();
  const { reduced } = useMotionSafe();
  const inset = (size.toggleHeight - size.toggleKnob) / 2;
  const travel = size.toggleWidth - size.toggleKnob - 2 * inset;
  const on = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    on.set(reduced ? (value ? 1 : 0) : withTiming(value ? 1 : 0, motion.toggle));
  }, [value, reduced, on]);
  const trackStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [c.rule, c.text]) }));
  const knobStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [c.muted, c.base]),
    transform: [{ translateX: on.value * travel }],
  }));
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      style={{ minWidth: size.hit, minHeight: size.hit, alignItems: 'center', justifyContent: 'center', opacity: disabled ? opacity.disabled : 1 }}
    >
      <Animated.View style={[{ width: size.toggleWidth, height: size.toggleHeight, borderRadius: radius.full, justifyContent: 'center' }, trackStyle]}>
        <Animated.View style={[{ width: size.toggleKnob, height: size.toggleKnob, borderRadius: radius.full, marginLeft: inset }, knobStyle]} />
      </Animated.View>
    </Pressable>
  );
}
