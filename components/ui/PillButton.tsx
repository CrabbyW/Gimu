import { Pressable, StyleSheet, View, type GestureResponderEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { feedback } from '@/lib/feedback';
import { motion } from '@/lib/motion';
import { opacity, useTheme } from '@/theme';
import { DotLoader } from './DotLoader';
import { usePressFeedback } from './usePressFeedback';
import { Text } from './Text';

export type PillVariant = 'primary' | 'secondary';

export interface PillButtonProps {
  /** Věta v sentence case („Začít lekci“). Zobrazí se jako `[ZAČÍT LEKCI]`, čtečka dostane větu bez závorek. */
  label: string;
  onPress(): void;
  variant?: PillVariant;
  disabled?: boolean;
  /** Akce běží: místo popisku DotLoader, šířka a výška se nemění. */
  loading?: boolean;
  /** Na plné akcentové ploše (stage-up): primární = plocha `onAccent` s popiskem v akcentu, sekundární obrys `onAccent`. */
  onAccent?: boolean;
  /** Na zlaté ploše (stage-up): primární = výplň `onSeasonGold` s popiskem `onGoldPill`, sekundární obrys `onSeasonGold`. */
  onGold?: boolean;
  /** Motion vrstva (stisk, nástup zdola); staticky nic. */
  motionStyle?: StyleProp<ViewStyle>;
  onPressIn?(e: GestureResponderEvent): void;
  onPressOut?(e: GestureResponderEvent): void;
  /** Jen umístění v layoutu (šířka, okraje), ne vzhled. */
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  /** Velká varianta 64 (`size.pillLarge`): hlavní akce během cvičení (zpocené prsty, celá šířka). */
  large?: boolean;
}

/** Text pilulky: mono verzálky v hranatých závorkách (obr. 1). */
export const pillText = (label: string) => `[${label.toUpperCase()}]`;

/**
 * Pilulkové CTA (spec §2.3, obr. 1): výška 56, plná šířka, radius full.
 * Primární = výplň `text`, popisek `onText` (nejsilnější plocha obrazovky, jediná plná). Sekundární = `tile` + `edge`.
 * Stisk mění výplň (`accentPressed` / `tilePressed`); scale a haptiku drží motion vrstva a `feedback`.
 */
export function PillButton({
  label, onPress, variant = 'primary', disabled = false, loading = false, onAccent = false, onGold = false, motionStyle, onPressIn, onPressOut, style, accessibilityHint, large = false,
}: PillButtonProps) {
  const { c, radius, size, space } = useTheme();
  // Stisk (motion): scale 0.97 za `motion.press`, návrat `motion.release`, bez pružiny (spec §3).
  const press = usePressFeedback(motion.tilePress.scale);
  const inactive = disabled || loading;
  const primary = variant === 'primary';
  const fill = (pressed: boolean) => {
    // Zlatá plocha (stage-up, QA N2): tmavá pilulka `onSeasonGold` (vůči zlatu ≥ 4.5:1 v obou režimech),
    // světlá `onAccent` pilulka by v light měla hranu ~2.1:1.
    if (onGold) return primary ? c.onSeasonGold : 'transparent';
    if (onAccent) return primary ? c.onAccent : 'transparent';
    if (primary) return pressed ? c.accentPressed : c.text;
    return pressed ? c.tilePressed : c.tile;
  };
  const ink = onGold ? (primary ? c.onGoldPill : c.onSeasonGold)
    : onAccent ? (primary ? c.accent : c.onAccent) : primary ? c.onText : c.text;
  return (
    <Animated.View style={[{ alignSelf: 'stretch' }, press.style, motionStyle, style]}>
      <Pressable
        onPress={() => { if (!inactive) onPress(); }}
        onPressIn={(e) => { if (!inactive) { feedback(primary ? 'cta' : 'tapLight'); press.onPressIn(); } onPressIn?.(e); }}
        onPressOut={(e) => { press.onPressOut(); onPressOut?.(e); }}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        style={({ pressed }) => ({
          minHeight: large ? size.pillLarge : size.pill,
          borderRadius: radius.full,
          paddingHorizontal: space.l,
          paddingVertical: space.s,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fill(pressed && !inactive),
          // Sekundární pilulka nese vlasovou hranu jako dlaždice; primární je jen výplň.
          borderWidth: primary && !onAccent && !onGold ? 0 : StyleSheet.hairlineWidth,
          borderColor: onGold ? c.onSeasonGold : onAccent ? c.onAccent : c.edge,
          opacity: disabled ? opacity.disabled : 1,
        })}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="pill" numberOfLines={1} importantForAccessibility="no" style={{ color: ink, opacity: loading ? 0 : 1, textAlign: 'center' }}>
            {pillText(label)}
          </Text>
          {loading ? <View style={{ position: 'absolute' }}><DotLoader color={ink} size={size.loaderDot * 6} /></View> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}
