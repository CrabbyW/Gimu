import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { Text } from './Text';
import { usePressFeedback } from './usePressFeedback';

export interface CtaAction { label: string; onPress(): void; disabled?: boolean }

const DIAMETER = 88;
// Inter SemiBold 16 pt má průměrnou šířku znaku ≈ 0.55 em, tj. ~9 pt: 7 znaků
// (~62 pt) se do kruhu 88 pt vejde s okrajem, delší popisek by se dotýkal obvodu.
const MAX_ROUND_CHARS = 7;

/** Vejde se popisek do kulatého CTA? Delší popisek dostane pilulku (a v BigActionBar širší buňku). */
export const fitsRoundCta = (label: string): boolean => label.length <= MAX_ROUND_CHARS;

/** Hlavní CTA spodní lišty: kulaté 88 pt v akcentu; delší popisek → pilulka 64 pt na šířku buňky. */
export function RoundCta({ label, onPress, disabled = false }: CtaAction) {
  const { c, space, radius } = useTheme();
  const feedback = usePressFeedback(0.96);
  const round = fitsRoundCta(label);
  return (
    <Animated.View style={[feedback.style, round ? null : { alignSelf: 'stretch' }]}>
      <Pressable
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        style={{
          width: round ? DIAMETER : '100%',
          height: round ? DIAMETER : 64,
          paddingHorizontal: round ? 0 : space.l,
          borderRadius: radius.full,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <Text variant="bodyStrong" tone="onAccent" numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}
