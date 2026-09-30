import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { useSelectionProgress } from '@/components/ui/useSelectionProgress';
import { useTheme } from '@/theme';
import type { PathMeta } from '@/types';
import { PathGlyph } from './PathGlyph';

interface Props { path: PathMeta; selected: boolean; onPress(): void }

const STRIPE_WIDTH = 2;

/** Velká karta cesty. Karta se odděluje jen pozadím; výběr nese 2px akcentový proužek vlevo a glyf v akcentu. */
export function PathCard({ path, selected, onPress }: Props) {
  const { c, space, radius, size } = useTheme();
  const feedback = usePressFeedback(0.98);
  const sel = useSelectionProgress(selected);
  const stripeStyle = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scaleY: 0.3 + 0.7 * sel.value }] }));
  const accentGlyph = useAnimatedStyle(() => ({ opacity: sel.value }));
  return (
    <Animated.View style={feedback.style}>
      <Pressable
        onPress={onPress}
        onPressIn={feedback.onPressIn}
        onPressOut={feedback.onPressOut}
        accessibilityRole="radio"
        accessibilityLabel={`${path.name}. ${path.tagline}`}
        accessibilityState={{ selected, checked: selected }}
        style={{
          minHeight: size.pathCard, flexDirection: 'row', alignItems: 'center', gap: space.m,
          padding: space.l, borderRadius: radius.l, backgroundColor: c.surface,
        }}
      >
        {/* Proužek je odsazený od zaoblených rohů, aby zůstal rovnou linkou. */}
        <Animated.View
          style={[stripeStyle, { position: 'absolute', left: 0, top: space.l, bottom: space.l, width: STRIPE_WIDTH, backgroundColor: c.accent }]}
        />
        <View>
          <PathGlyph path={path.id} color={c.text} bg={c.surface} />
          <Animated.View style={[accentGlyph, { position: 'absolute', left: 0, top: 0 }]}><PathGlyph path={path.id} color={c.accent} bg={c.surface} /></Animated.View>
        </View>
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="title">{path.name}</Text>
          <Text variant="caption" tone="muted">{path.tagline}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
