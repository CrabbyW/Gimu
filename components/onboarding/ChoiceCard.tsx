import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
import { useTheme } from '@/theme';

interface Props {
  title: string;
  line: string;
  selected: boolean;
  onPress(): void;
  /** Glyf vlevo; dostane barvu podle výběru. */
  renderGlyph(color: string, bg: string): ReactNode;
}

/**
 * Kompaktní karta volby (onboarding, vize těla). Stejná gramatika jako `PathCard`: karta se
 * odděluje jen pozadím, výběr nese proužek `stroke.focus` v `text` vlevo a glyf přecházející
 * z `muted` do `text` (R42: bez akcentu, stav nese kontrast a tvar; a11y nese `selected`).
 * Motion (UX2): proužek vyroste od středu (scaleY 0.3 → 1) a prolne se, glyf přejde muted → text
 * crossfadem dvou vrstev; výběr `motion.ui`, zrušení `motion.uiExit`.
 */
export function ChoiceCard({ title, line, selected, onPress, renderGlyph }: Props) {
  const { c, space, radius, size, stroke } = useTheme();
  const feedback = usePressFeedback(0.98);
  const sel = useSelectionProgress(selected);
  const stripeStyle = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scaleY: 0.3 + 0.7 * sel.value }] }));
  const selGlyph = useAnimatedStyle(() => ({ opacity: sel.value }));
  return (
    <Animated.View style={feedback.style}>
      <Pressable
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        accessibilityRole="radio"
        accessibilityLabel={`${title}. ${line}`}
        accessibilityState={{ selected, checked: selected }}
        style={{
          minHeight: size.choiceCard, flexDirection: 'row', alignItems: 'center', gap: space.m,
          paddingVertical: space.m, paddingHorizontal: space.l, borderRadius: radius.l, backgroundColor: c.surface,
        }}
      >
        <Animated.View style={[stripeStyle, { position: 'absolute', left: 0, top: space.m, bottom: space.m, width: stroke.focus, backgroundColor: c.text }]} />
        <View>
          {renderGlyph(c.muted, c.surface)}
          <Animated.View style={[selGlyph, { position: 'absolute', left: 0, top: 0 }]}>{renderGlyph(c.text, c.surface)}</Animated.View>
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="choiceTitle">{title}</Text>
          <Text variant="caption" tone="muted">{line}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
