import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { PillButton } from '@/components/ui/PillButton';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { haptics } from '@/lib/haptics';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { LeagueWeekResult } from '@/types';
import { TierBadge } from './TierBadge';

interface Props { result: LeagueWeekResult; toTierName: string; onDismiss(): void }

const SLIDE = 24;
const FADE = motion.calmFade;

/**
 * Výsledek minulého týdne (Nothing Dot fáze 2): dlaždice s tečkovým odznakem nové úrovně vlevo, mono štítkem
 * „MINULÝ TÝDEN · 3. MÍSTO“, větou výsledku a sekundární pilulkou. Vysune se shora (`motion.ui`); u postupu
 * odznak naskočí `motion.pop` (herní odměna, není klikatelný) + haptika success. Omezený pohyb: 200 ms fade.
 */
export function LeagueResultBanner({ result, toTierName, onDismiss }: Props) {
  const { space } = useTheme();
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

  return (
    <Animated.View accessibilityLiveRegion="polite" style={[box, { marginHorizontal: space.l, marginBottom: space.m }]}>
      <Tile style={{ gap: space.m }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
          <Animated.View style={badgeStyle}><TierBadge tierId={result.toTier} tierName={toTierName} /></Animated.View>
          <View style={{ flex: 1, minWidth: 0, gap: space.xs }}>
            <Text variant="label" tone="muted" accessibilityLabel={copy.league.lastWeekA11y(result.rank)}>{copy.league.lastWeek(result.rank)}</Text>
            <Text variant="bodyStrong">{copy.league.result[result.outcome](toTierName)}</Text>
          </View>
        </View>
        <PillButton label={copy.league.dismiss} variant="secondary" onPress={close} />
      </Tile>
    </Animated.View>
  );
}
