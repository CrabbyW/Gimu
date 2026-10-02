import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Text, type TextTone } from './Text';
import { usePressFeedback } from './usePressFeedback';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress(): void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Tlačítko leží na plné akcentové ploše oslavy (stage-up, odměna v recapu): inkoust `onAccent`
   *  místo `text`, primární = plocha `onAccent` s popiskem v akcentu (stejný kontrastní pár). */
  onAccent?: boolean;
  /** Jen pro umístění v layoutu (šířka, zarovnání), ne pro vzhled. */
  style?: StyleProp<ViewStyle>;
}

// R42: primární akce nese stav kontrastem (světlá plocha na tmavém), ne akcentem.
const labelTone: Record<ButtonVariant, TextTone> = { primary: 'inverse', secondary: 'text', ghost: 'text' };

export function Button({ label, onPress, variant = 'primary', disabled = false, onAccent = false, style }: Props) {
  const { c, space, radius, size } = useTheme();
  const feedback = usePressFeedback(0.97);
  if (onAccent) {
    // Neaktivní primární na akcentu = obrys (stav „hotovo“, např. Převzato), ne šedá plocha.
    const solid = variant === 'primary' && !disabled;
    return (
      <Animated.View style={[feedback.style, style]}>
        <Pressable
          onPress={onPress}
          onPressIn={feedback.onPressIn}
          onPressOut={feedback.onPressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          style={{
            minHeight: size.hitLarge, borderRadius: radius.full, paddingHorizontal: space.l,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: solid ? c.onAccent : 'transparent',
            borderWidth: solid || variant === 'ghost' ? 0 : 1,
            borderColor: c.onAccent,
          }}
        >
          <Text variant="bodyStrong" numberOfLines={1} style={{ color: solid ? c.accent : c.onAccent }}>{label}</Text>
        </Pressable>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={[feedback.style, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={{
          minHeight: size.hitLarge,
          borderRadius: radius.full,
          paddingHorizontal: space.l,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: variant === 'primary' ? (disabled ? c.surface : c.text) : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: c.rule,
          // Neaktivní primární nezprůhledňuje plnou plochu (vznikl by nový odstín), přejde na neutrální plochu.
          opacity: disabled && variant !== 'primary' ? 0.4 : 1,
        }}
      >
        <Text variant="bodyStrong" tone={disabled && variant === 'primary' ? 'muted' : labelTone[variant]} numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
