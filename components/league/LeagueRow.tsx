import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Mascot } from '@/components/mascot';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion, stagger, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { LeagueEntry } from '@/types';

const RISE = 8;

interface Props { entry: LeagueEntry; rank: number; /** Pořadí v nástupu (stagger). */ index: number }

/**
 * Řádek tabulky 56 pt: pořadí (Bebas, tabulární, 32), mini opice 32, jméno Inter 600, XP vpravo.
 * Vlastní řádek: pozadí `raised` + akcentový proužek 3 pt vlevo. Jediná oddělovací technika, žádné linky mezi řádky.
 */
export function LeagueRow({ entry, rank, index }: Props) {
  const { c, space, size } = useTheme();
  const me = entry.isMe;
  // Nástup řádku: fade + zdvih 8 pt, sled `stagger(i)` (≤ 360 ms), `motion.enter`. Vlastní shared value
  // místo layout animace `entering`: ta se ve virtualizovaných buňkách FlatListu na webu rozjede (překryv řádků).
  const { reduced } = useMotionSafe();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { if (!reduced) t.set(withDelay(stagger(index), withTiming(1, motion.enter))); }, [index, reduced, t]);
  const enter = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * RISE }] }));
  return (
    <Animated.View
      accessible
      accessibilityLabel={copy.league.rowA11y(rank, entry.name, entry.xpThisWeek)}
      style={[enter, {
        height: size.leagueRow, flexDirection: 'row', alignItems: 'center', gap: space.m, paddingHorizontal: space.l,
        backgroundColor: me ? c.raised : 'transparent',
      }]}
    >
      {me ? <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: size.ownStripe, backgroundColor: c.accent }} /> : null}
      <Text variant="counter" tone={me ? 'text' : 'muted'} maxFontSizeMultiplier={1} style={{ width: size.rankCol, textAlign: 'right' }}>
        {rank}
      </Text>
      {/* Maskot bez interakce; dech běží dál (reanimated na UI vlákně). */}
      <View pointerEvents="none">
        <Mascot stage={entry.stage} cosmetics={entry.cosmetics} mood="idle" size={size.rowMascot} />
      </View>
      <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>{entry.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs }}>
        <Text variant="counter" maxFontSizeMultiplier={1}>{entry.xpThisWeek}</Text>
        <Text variant="label" tone="muted">{copy.league.xp}</Text>
      </View>
    </Animated.View>
  );
}
