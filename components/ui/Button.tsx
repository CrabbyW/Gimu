import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { feedback } from '@/lib/feedback';
import { motion, useMotionSafe } from '@/lib/motion';
import { opacity, useTheme, type Colors } from '@/theme';
import { DotLoader } from './DotLoader';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress(): void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Akce běží: místo popisku DotLoader v barvě textu, šířka se nemění. */
  loading?: boolean;
  /** Tlačítko leží na plné akcentové ploše (stage-up): primární = plocha `onAccent` s popiskem v akcentu,
   *  ostatní obrys/text v `onAccent`. */
  onAccent?: boolean;
  /** Jen pro umístění v layoutu (šířka, zarovnání), ne pro vzhled. */
  style?: StyleProp<ViewStyle>;
}

// Teplá litina §2.7: stisk = změna výplně, ne glow. Ghost má plochu jen ve stisku.
/** Vtlačení (motion spec §10.1): o 2 pt dolů za `motion.press`, návrat `motion.cvak`, bez pružiny. */
export const PRESS_DEPTH = 2;

const FILL: Record<ButtonVariant, { idle: keyof Colors | null; pressed: keyof Colors; ink: keyof Colors }> = {
  primary: { idle: 'accent', pressed: 'accentPressed', ink: 'onAccent' },
  secondary: { idle: 'raised', pressed: 'raisedPressed', ink: 'text' },
  ghost: { idle: null, pressed: 'raised', ink: 'text' },
};

export function Button({ label, onPress, variant = 'primary', disabled = false, loading = false, onAccent = false, style }: Props) {
  const { c, space, radius, size } = useTheme();
  const { reduced } = useMotionSafe();
  // Omezený pohyb: bez posunu, stisk nese jen výplň (`accentPressed` / `raisedPressed`).
  const y = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : y.value }] }));
  const f = FILL[variant];
  const ink = onAccent ? (variant === 'primary' ? c.accent : c.onAccent) : c[f.ink];
  const fill = (pressed: boolean) => {
    if (onAccent) return variant === 'primary' ? c.onAccent : 'transparent';
    if (pressed) return c[f.pressed];
    return f.idle ? c[f.idle] : 'transparent';
  };
  const inactive = disabled || loading;
  return (
    <Animated.View style={[pressStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { y.set(withTiming(PRESS_DEPTH, motion.press)); feedback(variant === 'primary' ? 'cta' : 'tapLight'); }}
        onPressOut={() => { y.set(withTiming(0, motion.cvak)); }}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, busy: loading }}
        style={({ pressed }) => ({
          // Nothing Dot §2.3: pilulka (radius full), výška jako PillButton; obsah zůstává Inter (vedlejší akce v obsahu).
          minHeight: size.pill,
          minWidth: size.hit,
          borderRadius: radius.full,
          paddingHorizontal: space.l,
          // (56 − 24) / 2: jeden řádek drží min. výšku, dva řádky ji zvětší.
          paddingVertical: (size.pill - space.l) / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fill(pressed),
          // Sekundární nese vlasovou hranu dlaždice; na akcentové ploše obrys `onAccent`.
          borderWidth: variant === 'secondary' ? (onAccent ? 1 : StyleSheet.hairlineWidth) : 0,
          borderColor: onAccent ? c.onAccent : c.edge,
          opacity: disabled ? opacity.disabled : 1,
        })}
      >
        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* Neviditelný popisek drží šířku, DotLoader leží přes něj. */}
            <Text variant="bodyStrong" numberOfLines={2} style={{ color: ink, opacity: 0, textAlign: 'center' }}>{label}</Text>
            <View style={{ position: 'absolute' }}><DotLoader color={ink} size={size.loaderDot * 6} /></View>
          </View>
        ) : (
          <Text variant="bodyStrong" numberOfLines={2} style={{ color: ink, textAlign: 'center' }}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
