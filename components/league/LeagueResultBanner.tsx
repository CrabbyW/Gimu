import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { LeagueWeekResult } from '@/types';
import { TierBadge } from './TierBadge';

interface Props { result: LeagueWeekResult; toTierName: string; onDismiss(): void }

const SLIDE = 24;
const FADE = { duration: 200 };

/**
 * Výsledek minulého týdne. Vysune se shora (`motion.ui`); u postupu odznak nové úrovně naskočí pružinou
 * `motion.pop` (herní odměna) + haptika success. Omezený pohyb: jen 200ms fade, bez pružiny.
 */
export function LeagueResultBanner({ result, toTierName, onDismiss }: Props) {
  const { c, space } = useTheme();
  const { reduced } = useMotionSafe();
  const shown = useSharedValue(0);
  const badge = useSharedValue(result.outcome === 'promote' && !reduced ? 0.6 : 1);
  const promote = result.outcome === 'promote';

  useEffect(() => {
    shown.set(withTiming(1, reduced ? FADE : motion.ui));
    if (promote) {
      if (!reduced) badge.set(withSpring(1, motion.pop));
      haptics.success();
    }
  }, [badge, promote, reduced, shown]);

  const box = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: reduced ? [] : [{ translateY: (1 - shown.value) * -SLIDE }],
  }));
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));

  const close = () => {
    shown.set(withTiming(0, reduced ? FADE : motion.uiExit, (done) => { if (done) scheduleOnRN(onDismiss); }));
  };

  const line = copy.league.result[result.outcome](toTierName);
  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      style={[box, { backgroundColor: c.surface, padding: space.l, flexDirection: 'row', alignItems: 'center', gap: space.l }]}
    >
      <Animated.View style={badgeStyle}><TierBadge tierName={toTierName} bare /></Animated.View>
      <View style={{ flex: 1, gap: space.s, alignItems: 'flex-start' }}>
        <Text variant="label" tone="muted">{copy.league.lastWeek(result.rank)}</Text>
        <Text variant="bodyStrong">{line}</Text>
        <Button label={copy.league.dismiss} variant="secondary" onPress={close} />
      </View>
    </Animated.View>
  );
}
