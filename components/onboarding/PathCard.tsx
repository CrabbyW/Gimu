import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { usePressFeedback } from '@/components/ui/usePressFeedback';
import { motion } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { PathMeta } from '@/types';
import { PathGlyph } from './PathGlyph';

interface Props { path: PathMeta; selected: boolean; onPress(): void }

const STRIPE_WIDTH = 2;

/** Velká karta cesty. Karta se odděluje jen pozadím; výběr nese 2px akcentový proužek vlevo a glyf v akcentu. */
export function PathCard({ path, selected, onPress }: Props) {
  const { c, space, radius, size } = useTheme();
  const feedback = usePressFeedback(0.98);
  const stripe = useSharedValue(selected ? 1 : 0);
  useEffect(() => { stripe.value = withTiming(selected ? 1 : 0, selected ? motion.ui : motion.uiExit); }, [selected, stripe]);
  const stripeStyle = useAnimatedStyle(() => ({ opacity: stripe.value }));
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
        <PathGlyph path={path.id} color={selected ? c.accent : c.text} bg={c.surface} />
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="title">{path.name}</Text>
          <Text variant="caption" tone="muted">{path.tagline}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
